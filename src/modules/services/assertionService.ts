import { config } from '../ClientEnv';
import { 
  AssertionConfig, 
  TokenResponseBody, 
  IssueAccessTokenResult 
} from '../types/assertion';
import { createClientAssertion } from '../utils/assertionUtils';

export interface AssertionServiceCallbacks {
  onAssertionCreated?: (assertion: string) => void;
  onError?: (error: Error) => void;
}

export class AssertionService {
  private callbacks: AssertionServiceCallbacks;

  constructor(callbacks: AssertionServiceCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Client Assertion 생성
   * @param assertionConfig - assertion 생성에 필요한 설정
   * @returns 생성된 assertion JWT
   */
  public async createClientAssertion(assertionConfig: AssertionConfig): Promise<string> {
    try {
      console.log('AssertionService: Starting client assertion creation...');
      
      // ClientEnv에서 JWT assertion audience 가져오기
      const assertionAudience = config.assertionAudienceEndpoint;
      console.log('AssertionService: Assertion audience:', assertionAudience);
      
      // Client Assertion 생성
      const assertion = await createClientAssertion(
        assertionConfig.privateKey,
        assertionConfig.clientId,
        assertionAudience
      );
      
      console.log('AssertionService: Client assertion created successfully');
      
      // 콜백 호출
      if (this.callbacks.onAssertionCreated) {
        this.callbacks.onAssertionCreated(assertion);
      }
      
      return assertion;
      
    } catch (error) {
      console.error('AssertionService: Failed to create assertion:', error);
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      if (this.callbacks.onError) {
        this.callbacks.onError(errorObj);
      }
      
      throw errorObj;
    }
  }


  /**
   * 콜백 업데이트
   * @param callbacks - 새로운 콜백 함수들
   */
  public updateCallbacks(callbacks: Partial<AssertionServiceCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 서비스 정리
   */
  public cleanup(): void {
    this.callbacks = {};
  }
}
