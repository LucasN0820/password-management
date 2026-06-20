import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from '@repo/i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

interface InlineInterface { onRetry: () => void }
function ErrorFallback({ onRetry }: InlineInterface) {
  const { t } = useTranslation();

  return (
    <div
      className='flex h-screen items-center justify-center bg-background px-6'
      role='alert'
    >
      <div className='w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm'>
        <AlertTriangle className='mx-auto mb-4 h-10 w-10 text-destructive' />
        <h1 className='font-heading text-2xl font-medium text-foreground'>
          {t('errors.unexpectedTitle')}
        </h1>
        <p className='mt-2 text-sm leading-6 text-muted-foreground'>
          {t('errors.unexpectedDescription')}
        </p>
        <button
          type='button'
          className='mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90'
          onClick={onRetry}
        >
          <RotateCcw className='h-4 w-4' />
          {t('errors.tryAgain')}
        </button>
      </div>
    </div>
  );
}

// React still requires a class component to implement an error boundary.
// eslint-disable-next-line no-restricted-syntax/noClasses
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled renderer error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    const { children } = this.props;
    const { hasError } = this.state;
    if (!hasError) {return children;}

    return <ErrorFallback onRetry={this.handleRetry} />;
  }
}
