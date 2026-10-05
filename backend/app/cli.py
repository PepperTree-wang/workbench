"""管理命令：

    python -m app.cli create-admin <username>      # 交互式输入密码
    python -m app.cli reset-password <username>
"""
import argparse
import getpass
import sys

from sqlalchemy import select

from .database import Base, SessionLocal, engine
from .models import User
from .security import hash_password


def _ask_password() -> str:
    pw = getpass.getpass("密码: ")
    if len(pw) < 8:
        sys.exit("密码至少 8 位")
    if pw != getpass.getpass("再次输入: "):
        sys.exit("两次输入不一致")
    return pw


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    sub = parser.add_subparsers(dest="cmd", required=True)
    for name in ("create-admin", "reset-password"):
        sub.add_parser(name).add_argument("username")
    args = parser.parse_args()

    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.username == args.username))
        if args.cmd == "create-admin":
            if user:
                sys.exit(f"用户 {args.username} 已存在")
            db.add(User(username=args.username, password_hash=hash_password(_ask_password())))
        else:
            if not user:
                sys.exit(f"用户 {args.username} 不存在")
            user.password_hash = hash_password(_ask_password())
        db.commit()
    print("完成")


if __name__ == "__main__":
    main()
