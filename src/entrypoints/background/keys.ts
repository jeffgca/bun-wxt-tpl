import type { ProxyServiceKey } from '@webext-core/proxy-service'
import type { TestService } from './utils'
//     ^^^^ IMPORTANT: do not import the Test service's value, just it's type.

// 2. [Optional] Define a key with a branded type to ensure type-safety
export const TEST_SERVICE_KEY = 'test-service' as ProxyServiceKey<TestService>
