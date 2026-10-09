import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PrincipalService } from './principal.service';
import { RbacService } from './rbac.service';
import { TokenService } from './token.service';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [TokenService, PrincipalService, RbacService, JwtAuthGuard, TenantGuard, PermissionsGuard],
  exports: [TokenService, PrincipalService, RbacService, JwtAuthGuard, TenantGuard, PermissionsGuard],
})
export class SecurityModule {}
