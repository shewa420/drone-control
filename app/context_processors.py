from fastapi import Request
from starlette.middleware.sessions import SessionMiddleware
from starlette.templating import Jinja2Templates
from starlette.responses import Response

templates = Jinja2Templates(directory="app/templates")

# Этот context_function будет вызываться при каждом рендере
@templates.env.globals.update
def get_current_user(request: Request):
    return request.session.get("user")
