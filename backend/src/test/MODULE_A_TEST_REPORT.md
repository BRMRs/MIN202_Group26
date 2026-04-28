# Module A — 单元测试交付说明

## 1. 代码结构分析

| 类 | 测试策略 | 原因 |
|---|---|---|
| `AuthService` | Service 单元测试 (`@ExtendWith(MockitoExtension.class)`) | 纯业务逻辑，依赖 Repository/PasswordEncoder/JWT 均可 Mock |
| `EmailVerificationService` | Service 单元测试 | 内部用 `ConcurrentHashMap` 存 code，无外部 DB，只需 Mock `JavaMailSender` |
| `UserService` | Service 单元测试 + `@TempDir` | 文件上传写真实临时目录，其余依赖全 Mock |
| `JwtTokenProvider` | 纯单元测试（无 Mock） | 无 Spring 依赖，直接 `new` 实例测试加密/解析/校验逻辑 |
| `AuthController` | `@WebMvcTest` + MockMvc | 测试 HTTP 层：路由、请求体校验、响应状态码、JSON 结构 |
| `UserController` | `@WebMvcTest` + MockMvc | 同上，含 multipart 文件上传和认证拦截 |
| `AdminUserController` | `@WebMvcTest` + MockMvc | 同上，重点测试 `@PreAuthorize("hasRole('ADMIN')")` 的权限拦截 |

---

## 2. 测试文件列表

```
src/test/java/com/group26/heritage/
├── common/security/
│   └── JwtTokenProviderTest.java           (11 个测试)
└── module_a/
    ├── service/
    │   ├── AuthServiceTest.java             (17 个测试)
    │   ├── EmailVerificationServiceTest.java (17 个测试)
    │   └── UserServiceTest.java             (28 个测试)
    └── controller/
        ├── AuthControllerTest.java          (16 个测试)
        ├── UserControllerTest.java          (9 个测试)
        └── AdminUserControllerTest.java     (15 个测试)

src/test/resources/
└── application-test.properties
```

**总计：113 个测试方法**

---

## 3. 测试覆盖说明

### A. 用户注册

| 测试方法 | 覆盖场景 | 预期结果 |
|---|---|---|
| `register_ShouldCreateUser_WhenInputsAreValid` | 正常注册 | 200，返回 User |
| `register_ShouldEncodePassword_NotStorePlaintext` | 密码加密 | 存储的是 BCrypt hash |
| `register_ShouldAssignViewerRole_ByDefault` | 默认角色 | `UserRole.VIEWER` |
| `register_ShouldThrow_WhenEmailAlreadyExists` | 邮箱重复 | `IllegalArgumentException` |
| `register_ShouldThrow_WhenUsernameAlreadyExists` | 用户名重复 | `IllegalArgumentException` |
| `register_ShouldSetEmailVerifiedFalse` | 注册后未验证 | `emailVerified = false` |
| `register_ShouldGenerateVerificationToken` | 生成验证 token | token 不为空 |

> 密码强度（太短/缺大写/缺数字/缺特殊字符）由 `RegisterRequest` 的 Bean Validation 注解控制，在 Controller 层通过 `@Valid` 触发，对应 `AuthControllerTest` 中的 `send-code` / `verify-code-and-register` 的 400 测试。

### B. 邮箱验证码

| 测试方法 | 覆盖场景 | 预期结果 |
|---|---|---|
| `sendCode_ShouldSendEmail_WithSixDigitCode` | 发送验证码 | 邮件被发送 |
| `sendCode_ShouldGenerateSixDigitCode` | 6 位数字 | 正则 `\d{6}` 匹配 |
| `sendCode_ShouldSetCorrectFromAndSubject` | 发件人/主题 | 正确 |
| `sendCode_ShouldOverwriteOldCode_WhenCalledAgainForSameEmail` | 重复请求覆盖旧码 | 新码有效 |
| `sendCode_ShouldPropagate_WhenMailSenderThrows` | 邮件服务异常 | 异常向上传播 |
| `verifyCode_ShouldReturnTrue_WhenCodeIsCorrect` | 验证码正确 | `true` |
| `verifyCode_ShouldReturnFalse_WhenCodeIsWrong` | 验证码错误 | `false` |
| `verifyCode_ShouldReturnFalse_WhenNoPendingCode` | 无待验证码 | `false` |
| `verifyCode_ShouldConsumeCode_SoItCannotBeReused` | 验证码一次性 | 第二次返回 `false` |

### C. 用户登录

| 测试方法 | 覆盖场景 | 预期结果 |
|---|---|---|
| `login_ShouldReturnJwtToken_WhenUsernameAndPasswordAreCorrect` | username 登录 | 返回 JWT |
| `login_ShouldSucceed_WhenUsingEmailAsIdentifier` | email 登录 | 返回 JWT |
| `login_ShouldReturnCorrectUserInfo_WhenCredentialsAreValid` | 响应字段 | username/email/role 正确 |
| `login_ShouldThrowUnauthorized_WhenPasswordIsWrong` | 密码错误 | `UnauthorizedException` |
| `login_ShouldThrowUnauthorized_WhenUserDoesNotExist` | 用户不存在 | `UnauthorizedException` |

### D. JWT 鉴权

| 测试方法 | 覆盖场景 | 预期结果 |
|---|---|---|
| `generateToken_ShouldReturnNonBlankToken` | 生成 token | 不为空 |
| `generateToken_ShouldReturnWellFormedJwt` | JWT 格式 | 三段式 |
| `getUsernameFromToken_ShouldReturnCorrectUsername` | 解析 username | 与原始一致 |
| `validateToken_ShouldReturnTrue_ForValidToken` | 有效 token | `true` |
| `validateToken_ShouldReturnFalse_ForTamperedToken` | 篡改 token | `false` |
| `validateToken_ShouldReturnFalse_ForExpiredToken` | 过期 token | `false` |
| `validateToken_ShouldReturnFalse_ForTokenSignedWithDifferentSecret` | 不同密钥签名 | `false` |

### E. 忘记密码 / 重置密码

| 测试方法 | 覆盖场景 | 预期结果 |
|---|---|---|
| `sendResetCode_ShouldReturn200_WhenEmailIsRegistered` | 已注册邮箱 | 200 |
| `sendResetCode_ShouldReturn400_WhenEmailIsNotRegistered` | 未注册邮箱 | 400 |
| `verifyResetCode_ShouldReturn200_WhenCodeIsCorrect` | 验证码正确 | 200 |
| `verifyResetCode_ShouldReturn400_WhenCodeIsWrong` | 验证码错误 | 400 |
| `resetPassword_ShouldReturn200_WhenCodeIsValidAndPasswordIsReset` | 重置成功 | 200 |
| `resetPassword_ShouldReturn400_WhenResetCodeIsInvalid` | 验证码无效 | 400 |
| `resetPassword_ShouldEncodeNewPassword_NotStorePlaintext` | 新密码加密 | 存储 hash |
| `verifyResetCode_ShouldReturnTrueAndConsumeCode_WhenCorrect` | 验证码消费 | 第二次失效 |

### F. Profile

| 测试方法 | 覆盖场景 | 预期结果 |
|---|---|---|
| `getProfile_ShouldReturn200_WhenUserIsAuthenticated` | 已登录获取 profile | 200 |
| `getProfile_ShouldReturn401_WhenUserIsNotAuthenticated` | 未登录 | 401 |
| `getProfile_ShouldIncludeApplicationStatus_WhenApplicationExists` | 含申请状态 | status 字段正确 |
| `updateProfile_ShouldReturn200_WhenUpdateSucceeds` | 更新成功 | 200 |
| `updateProfile_ShouldReturn400_WhenUsernameAlreadyTaken` | 用户名冲突 | 400 |
| `updateProfile_ShouldThrow_WhenBioExceeds50Chars` | bio 超长 | `IllegalArgumentException` |
| `updateProfile_ShouldUpdateAvatarUrl` | 更新头像 URL | 字段更新 |

### G. Contributor 申请

| 测试方法 | 覆盖场景 | 预期结果 |
|---|---|---|
| `applyForContributor_ShouldCreatePendingApplication_ForViewerUser` | 正常提交 | status = PENDING |
| `applyForContributor_ShouldThrow_WhenPendingApplicationAlreadyExists` | 重复提交 | 400 |
| `applyForContributor_ShouldThrow_WhenUserIsNotViewer` | 非 VIEWER 申请 | 400 |
| `applyForContributor_ShouldThrow_WhenReasonIsBlank` | 理由为空 | 400 |
| `applyForContributor_ShouldSaveEvidenceFile_WhenValidFileProvided` | 附件上传 | `applicationFileRepository.save` 被调用 |
| `applyForContributor_ShouldThrow_WhenFileTypeIsNotAllowed` | 非法文件类型 | `IllegalStateException` |
| `applyForContributor_ShouldThrow_WhenMoreThanFiveFilesUploaded` | 超过 5 个文件 | 400 |

### H. 管理员审核

| 测试方法 | 覆盖场景 | 预期结果 |
|---|---|---|
| `getApplications_ShouldReturn200WithList_WhenCalledByAdmin` | 管理员查列表 | 200 |
| `getApplications_ShouldReturn403_WhenCalledByNonAdmin` | 非管理员 | 403 |
| `getApplications_ShouldReturn401_WhenNotAuthenticated` | 未登录 | 401 |
| `approveApplication_ShouldApproveAndUpgradeRole` | 批准 + 升级角色 | role = CONTRIBUTOR |
| `approveApplication_ShouldSendApprovalEmail` | 批准后发邮件 | `sendApplicationApprovedEmail` 被调用 |
| `approveApplication_ShouldThrow_WhenApplicationIsNotPending` | 重复审批 | `IllegalStateException` |
| `rejectApplication_ShouldRejectWithReason` | 拒绝 + 原因 | status = REJECTED |
| `rejectApplication_ShouldSendRejectionEmail` | 拒绝后发邮件 | `sendApplicationRejectedEmail` 被调用 |
| `rejectApplication_ShouldThrow_WhenRejectReasonIsBlank` | 拒绝原因为空 | 400 |
| `rejectApplication_ShouldNotChangeUserRole_WhenRejecting` | 拒绝不升级角色 | role 仍为 VIEWER |
| `rejectApplication_ShouldReturn403_WhenCalledByNonAdmin` | 非管理员 | 403 |

---

## 4. pom.xml 新增依赖

已自动写入 `pom.xml`：

```xml
<!-- MockMvc 中 .with(user(...)) 的支持 -->
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- @WebMvcTest 需要内存数据库，避免连接 MySQL -->
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

`spring-boot-starter-test`（JUnit 5 + Mockito + MockMvc + AssertJ）已在原 pom.xml 中，无需重复添加。

---

## 5. 运行方式

运行全部测试：

```bash
cd backend
mvn test -Dspring.profiles.active=test
```

只运行 Module A 测试：

```bash
mvn test -Dtest="com.group26.heritage.module_a.**,com.group26.heritage.common.security.JwtTokenProviderTest" -Dspring.profiles.active=test
```

---

## 6. 无法覆盖的场景说明

以下场景在当前代码中没有对应实现，因此无法生成测试：

| 场景 | 原因 | 建议 |
|---|---|---|
| 密码强度校验（太短/缺大写/缺数字/缺特殊字符）在 Service 层 | `AuthService.register()` 不做密码强度校验，校验注解在 `RegisterRequest` 上但 Controller 的 `register` 方法没有 `@Valid` | 在 `AuthController.register()` 的参数上加 `@Valid`，或在 `AuthService` 中加正则校验 |
| 验证码过期 | `EmailVerificationService` 用 `ConcurrentHashMap` 存储，没有 TTL/过期机制 | 改用 Caffeine Cache 或 Redis 并设置 TTL |
| 头像文件实际上传（multipart binary） | `updateProfile` 只接收 `avatarUrl` 字符串，没有头像文件上传接口 | 新增 `POST /api/users/avatar` 接口接收 `MultipartFile` |
