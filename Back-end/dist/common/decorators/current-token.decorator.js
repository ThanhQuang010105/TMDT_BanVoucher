"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentToken = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentToken = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader)
        return '';
    return authHeader.replace('Bearer ', '');
});
//# sourceMappingURL=current-token.decorator.js.map