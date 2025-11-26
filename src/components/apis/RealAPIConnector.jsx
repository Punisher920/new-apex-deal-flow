
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Key, 
  CheckCircle, 
  XCircle,
  Loader2,
  Settings,
  AlertTriangle,
  Zap // New icon for Test Connection
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/components/ui/use-toast";

const RealAPIConnector = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiStatus, setApiStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const handleConnect = async () => {
    setApiStatus('connecting');
    setErrorMessage('');

    // Simulate API connection attempt
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (apiKey && apiKey.length > 10) {
      setApiStatus('connected');
      toast({
        title: "API Connected",
        description: "Successfully established a connection with the data provider.",
        variant: "success",
      });
    } else {
      setApiStatus('error');
      const msg = 'Invalid API Key. Please check your key and try again.';
      setErrorMessage(msg);
      toast({
        title: "Connection Failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    setApiKey('');
    setApiStatus('disconnected');
    setErrorMessage('');
  };

  const getStatusBadge = () => {
    switch (apiStatus) {
      case 'connected':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'connecting':
        return <Badge variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Connecting...</Badge>;
      default:
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Disconnected</Badge>;
    }
  };

  return (
    <Card className="glass-effect border-slate-200/50 shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Real Estate API Connector
                </CardTitle>
                <CardDescription>
                    Connect to a national property data provider (e.g., ATTOM, Zillow API).
                </CardDescription>
            </div>
            {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>API Usage Policy</AlertTitle>
          <AlertDescription>
            You must comply with the terms of service for any API you connect. When using Zillow data, you are strictly prohibited from storing, reselling, or creating derivative works from their data.
          </AlertDescription>
        </Alert>
        
        <div>
          <Label htmlFor="api-key">API Key</Label>
          <div className="flex items-center gap-2 mt-1">
            <Key className="text-slate-400" />
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your property data API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={apiStatus === 'connected' || apiStatus === 'connecting'}
            />
          </div>
          {apiStatus === 'error' && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
        </div>

        <div className="flex justify-end gap-3">
            {apiStatus === 'connected' ? (
                <>
                    <Button variant="outline"><Settings className="w-4 h-4 mr-2" />Configure</Button>
                    <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
                </>
            ) : (
                <>
                    <Button 
                        variant="outline"
                        onClick={handleConnect} 
                        disabled={apiStatus === 'connecting' || !apiKey}
                    >
                        <Zap className="w-4 h-4 mr-2" />
                        Test Connection
                    </Button>
                    <Button 
                        onClick={handleConnect} 
                        disabled={apiStatus === 'connecting' || !apiKey}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {apiStatus === 'connecting' ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>
                        ) : (
                            "Connect API"
                        )}
                    </Button>
                </>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealAPIConnector;
