import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Bot } from 'lucide-react';

export default function AgentDiagnostics() {
  const [testResults, setTestResults] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const runDiagnostics = async () => {
    setIsTesting(true);
    const results = {
      agentSDKExists: false,
      agentsFound: [],
      conversationTest: null,
      messageTest: null,
      errors: []
    };

    try {
      // Test 1: Check if base44.agents exists
      if (base44.agents) {
        results.agentSDKExists = true;
        
        // Test 2: Try to list agents
        try {
          const agents = await base44.agents.list();
          results.agentsFound = agents || [];
        } catch (error) {
          results.errors.push(`Failed to list agents: ${error.message}`);
        }

        // Test 3: Try to create a test conversation
        if (results.agentsFound.length > 0) {
          try {
            const testAgent = results.agentsFound[0];
            const conversation = await base44.agents.createConversation({
              agent_name: testAgent.name,
              metadata: { name: 'Diagnostic Test' }
            });
            results.conversationTest = { success: true, conversationId: conversation.id };

            // Test 4: Try to send a message
            try {
              await base44.agents.addMessage(conversation, {
                role: 'user',
                content: 'This is a test message for diagnostics. Please respond with OK.'
              });
              results.messageTest = { success: true };
            } catch (error) {
              results.messageTest = { success: false, error: error.message };
            }

            // Clean up test conversation
            try {
              await base44.agents.deleteConversation(conversation.id);
            } catch (error) {
              // Ignore cleanup errors
            }
          } catch (error) {
            results.conversationTest = { success: false, error: error.message };
          }
        }
      } else {
        results.errors.push('base44.agents SDK not found. Agents may not be enabled for this app.');
      }
    } catch (error) {
      results.errors.push(`Critical error: ${error.message}`);
    }

    setTestResults(results);
    setIsTesting(false);
  };

  const StatusIcon = ({ success }) => {
    if (success === null) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return success ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Agent Diagnostics</h1>
          <p className="text-slate-600">Test whether your AI agents are properly configured and functional</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              Run Diagnostic Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runDiagnostics} 
              disabled={isTesting}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Agents...
                </>
              ) : (
                'Run Full Diagnostic'
              )}
            </Button>
          </CardContent>
        </Card>

        {testResults && (
          <div className="space-y-6">
            {/* SDK Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <StatusIcon success={testResults.agentSDKExists} />
                  Agent SDK Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.agentSDKExists ? (
                  <Alert className="bg-emerald-50 border-emerald-200">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertTitle className="text-emerald-900">SDK Found</AlertTitle>
                    <AlertDescription className="text-emerald-700">
                      The base44.agents SDK is available and accessible.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>SDK Not Found</AlertTitle>
                    <AlertDescription>
                      The agent SDK is not available. Agents may not be enabled for this app.
                      Contact base44 support to enable agents.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Agents Found */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <StatusIcon success={testResults.agentsFound.length > 0} />
                  Configured Agents ({testResults.agentsFound.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.agentsFound.length > 0 ? (
                  <div className="space-y-3">
                    {testResults.agentsFound.map((agent) => (
                      <div key={agent.name} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-slate-900">{agent.name}</h4>
                          <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                        </div>
                        <p className="text-sm text-slate-600">{agent.description}</p>
                        {agent.tool_configs && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {agent.tool_configs.map((tool, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tool.entity_name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Agents Found</AlertTitle>
                    <AlertDescription>
                      No agents are configured. Check that agent JSON files exist in the agents/ directory.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Conversation Test */}
            {testResults.conversationTest && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <StatusIcon success={testResults.conversationTest.success} />
                    Conversation Creation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.conversationTest.success ? (
                    <Alert className="bg-emerald-50 border-emerald-200">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <AlertTitle className="text-emerald-900">Success</AlertTitle>
                      <AlertDescription className="text-emerald-700">
                        Successfully created test conversation (ID: {testResults.conversationTest.conversationId})
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Failed</AlertTitle>
                      <AlertDescription>
                        Error: {testResults.conversationTest.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Message Test */}
            {testResults.messageTest && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <StatusIcon success={testResults.messageTest.success} />
                    Message Sending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.messageTest.success ? (
                    <Alert className="bg-emerald-50 border-emerald-200">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <AlertTitle className="text-emerald-900">Success</AlertTitle>
                      <AlertDescription className="text-emerald-700">
                        Successfully sent test message to agent.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Failed</AlertTitle>
                      <AlertDescription>
                        Error: {testResults.messageTest.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Errors */}
            {testResults.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    Errors Detected ({testResults.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResults.errors.map((error, idx) => (
                      <Alert key={idx} variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}