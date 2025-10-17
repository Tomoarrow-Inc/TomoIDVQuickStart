import { useState, useCallback, useRef, useEffect } from 'react';
import { AssertionService } from '../services/assertionService';
import { 
  AssertionConfig, 
  IssueAccessTokenResult, 
  UseAssertionProps, 
  UseAssertionReturn 
} from '../types/assertion';
import { useEnvironment } from './useEnvironment';

export const useAssertion = (props: UseAssertionProps = {}): UseAssertionReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isReady: isEnvironmentReady, error: envError } = useEnvironment();
  
  const serviceRef = useRef<AssertionService | null>(null);

  // Initialize service on mount
  useEffect(() => {
    console.log('useAssertion: useEffect triggered');
    console.log('useAssertion: isEnvironmentReady:', isEnvironmentReady);
    console.log('useAssertion: envError:', envError);
    
    if (!isEnvironmentReady) {
      console.log('useAssertion: Waiting for environment to be ready...');
      return;
    }

    console.log('useAssertion: Environment is ready, initializing service...');

    const callbacks = {
      onAssertionCreated: props.onAssertionCreated || (() => {}),
      onError: (error: Error) => {
        setError(error.message);
        if (props.onError) {
          props.onError(error);
        }
      }
    };

    serviceRef.current = new AssertionService(callbacks);
    console.log('useAssertion: Service initialized successfully');

    // Cleanup on unmount
    return () => {
      if (serviceRef.current) {
        serviceRef.current.cleanup();
      }
    };
  }, [props.onAssertionCreated, props.onError, isEnvironmentReady, envError]);

  // 디버깅을 위한 로그
  useEffect(() => {
    console.log('useAssertion: State changed - isEnvironmentReady:', isEnvironmentReady, 'envError:', envError);
  }, [isEnvironmentReady, envError]);

  const createClientAssertion = useCallback(async (config: AssertionConfig): Promise<string> => {
    if (!isEnvironmentReady) {
      const errorMsg = `Cannot create assertion: Environment is not ready: ${envError}`;
      console.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!serviceRef.current) {
      const errorMsg = 'Assertion service is not initialized';
      console.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setError(null);

    try {
      const assertion = await serviceRef.current.createClientAssertion(config);
      console.log('useAssertion: Assertion created successfully');
      return assertion;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('useAssertion: Assertion creation failed:', errorMsg);
      setError(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isEnvironmentReady, envError]);

  return {
    createClientAssertion,
    isLoading,
    error
  };
};
