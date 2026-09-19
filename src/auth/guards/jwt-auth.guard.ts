import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        console.log('[JWT Guard] Request:', request.method, request.path);

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        console.log('[JWT Guard] isPublic:', isPublic);

        if (isPublic) {
            console.log('[JWT Guard] Route is public, skipping auth');
            return true;
        }

        console.log('[JWT Guard] Checking JWT token...');
        return super.canActivate(context);
    }
}
