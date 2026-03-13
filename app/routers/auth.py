# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import create_access_token, get_current_user, require_manager_above, require_owner
from app.crud.user import authenticate_user, create_user, get_all_users, get_user_by_email, update_user, verify_password, hash_password
from app.schemas.user import Token, UserCreate, UserResponse, UserListResponse, UserUpdate, ChangePassword
from app.models.user import User
from fastapi import Request
from app.crud.audit import create_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/token", response_model=Token, summary="Login and obtain JWT")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.active:
        raise HTTPException(status_code=403, detail="Account is disabled. Contact admin.")

    token = create_access_token({"sub": user.email})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=list[UserListResponse], summary="List all users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_above),
):
    return get_all_users(db)


@router.post("/users", response_model=UserResponse, status_code=201, summary="Create a new user")
def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_above),
    request: Request = None,
):
    # Only owner can create other owners
    if user_in.role == "owner" and current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can create another owner account")

    existing = get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    created = create_user(db, user_in)
    try:
        ip = request.client.host if request and request.client else None
        create_audit(db, action='create_user', data={'id': created.id, 'email': created.email, 'role': created.role}, user_id=current_user.id, username=current_user.name, ip_address=ip)
    except Exception:
        pass
    return created


@router.put("/users/{user_id}", response_model=UserResponse, summary="Update a user")
def update_existing_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
    request: Request = None,
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Owner can only manage manager/employee accounts via this endpoint
    if user.role not in ("manager", "employee"):
        raise HTTPException(status_code=403, detail="Only manager/employee accounts can be updated")

    # Prevent assigning owner role from user-management update
    if user_in.role == "owner":
        raise HTTPException(status_code=403, detail="Owner role cannot be assigned from this action")

    if user_in.email:
        existing = get_user_by_email(db, user_in.email)
        if existing and existing.id != user.id:
            raise HTTPException(status_code=400, detail="Email already registered")

    updated = update_user(db, user, user_in)
    try:
        ip = request.client.host if request and request.client else None
        create_audit(db, action='update_user', data={'id': updated.id, 'changes': user_in.model_dump(exclude_unset=True)}, user_id=current_user.id, username=current_user.name, ip_address=ip)
    except Exception:
        pass
    return updated


@router.post('/change-password', summary='Change current user password')
def change_password(
    payload: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # verify current password
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail='Current password is incorrect')

    # update password
    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {"detail": "Password changed"}
