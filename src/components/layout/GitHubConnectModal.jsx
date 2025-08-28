import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@/api/entities";
import { Github } from "lucide-react";

export default function GitHubConnectModal({ onClose, onSuccess }) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!username.trim()) {
      setError('Please enter a GitHub username.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      // Fetch user data from GitHub API to verify and get avatar
      const response = await fetch(`https://api.github.com/users/${username}`);
      if (!response.ok) {
        throw new Error('User not found on GitHub.');
      }
      const githubData = await response.json();

      // Update the user data in base44
      await User.updateMyUserData({ 
        github_username: githubData.login,
        github_avatar_url: githubData.avatar_url
      });
      
      onSuccess();
    } catch (e) {
      setError(e.message || 'Failed to connect to GitHub. Please check the username and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-6 h-6" />
            Connect your GitHub Account
          </DialogTitle>
          <DialogDescription>
            Enter your GitHub username to link your account. This will display your avatar and link your profile on Ethos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="github-username" className="text-sm font-medium">GitHub Username</label>
            <Input
              id="github-username"
              placeholder="e.g., torvalds"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button 
            onClick={() => {}}
            className="w-full"
            disabled
          >
            <Github className="w-4 h-4 mr-2" />
            Connect with GitHub (Coming Soon)
          </Button>
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          <Button 
            onClick={handleConnect} 
            disabled={isLoading}
            variant="secondary"
            className="w-full"
          >
            {isLoading ? 'Verifying...' : 'Link Username Manually'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}