import React from 'react';
import { Button, Result } from 'antd';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="页面出现错误"
          subTitle={this.state.error?.message || '未知错误'}
          extra={<Button type="primary" onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>刷新页面</Button>}
        />
      );
    }
    return this.props.children;
  }
}
