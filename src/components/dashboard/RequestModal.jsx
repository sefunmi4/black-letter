
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Eye, Plus, Trash2 } from "lucide-react";

export default function RequestModal({ quest, onClose, onSubmit }) {
  const [requestType, setRequestType] = useState(quest.request_type !== 'none' ? quest.request_type : 'feedback');
  const [teamRoles, setTeamRoles] = useState(quest.team_roles || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRole = () => {
    setTeamRoles(prev => [...prev, { role_type: 'developer', count: 1, description: '' }]);
  };

  const updateRole = (index, field, value) => {
    const newRoles = [...teamRoles];
    newRoles[index][field] = value;
    setTeamRoles(newRoles);
  };
  
  const removeRole = (index) => {
      const newRoles = teamRoles.filter((_, i) => i !== index);
      setTeamRoles(newRoles);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (requestType === 'team_help') {
      // Removed the check for teamRoles.length === 0 to allow applications without predefined roles.
      if (teamRoles.some(role => !role.role_type || !role.count)) {
        alert("Please ensure all roles have a type and count specified.");
        return;
      }
    }
    
    setIsSubmitting(true);
    onSubmit({
      request_type: requestType,
      team_roles: requestType === 'team_help' ? teamRoles : [],
    });
    // The parent component will handle closing and state updates
  };

  const canSubmit = requestType !== 'none';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Request Help</DialogTitle>
          <DialogDescription>
            Ask for feedback on your work or find teammates to collaborate with.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRequestType('feedback')}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                requestType === 'feedback' ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="w-6 h-6 mb-2 text-purple-600" />
              <span className="font-medium text-gray-900 dark:text-gray-100">Get Feedback</span>
            </button>
            <button
              type="button"
              onClick={() => setRequestType('team_help')}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                requestType === 'team_help' ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <UserPlus className="w-6 h-6 mb-2 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-gray-100">Find Teammates</span>
            </button>
          </div>

          {requestType === 'team_help' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg space-y-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-200">Define Roles Needed (Optional)</h3>
              {teamRoles.map((role, index) => (
                <div key={index} className="flex items-end gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-gray-500">Role Type</label>
                    <Select
                      value={role.role_type}
                      onValueChange={(value) => updateRole(index, 'role_type', value)}
                    >
                      <SelectTrigger className="bg-gray-50 dark:bg-gray-900"><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="freelancer">Freelancer</SelectItem>
                        <SelectItem value="explorer">Explorer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 space-y-1">
                     <label className="text-xs font-medium text-gray-500">Count</label>
                    <Input
                      type="number"
                      value={role.count}
                      min="1"
                      onChange={(e) => updateRole(index, 'count', parseInt(e.target.value) || 1)}
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                   <Button type="button" onClick={() => removeRole(index)} variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" onClick={addRole} variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            </div>
          )}
          
           {requestType === 'feedback' && (
             <div className="p-4 bg-purple-50 dark:bg-purple-900/50 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-purple-800 dark:text-purple-200 text-sm">Your post will be featured in the "Open Requests" section for community feedback and reviews.</p>
             </div>
           )}


          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Set Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
