
import React, { useState, useRef, useEffect } from "react";
import { Quest, QuestLog, User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  Save,
  Plus,
  Youtube,
  Instagram,
  Clapperboard
} from "lucide-react";

export default function EditQuest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questId = searchParams.get('id');
  const fileInputRef = useRef(null);

  const [quest, setQuest] = useState(null);
  const [questData, setQuestData] = useState({
    title: "",
    description: "",
    tags: [],
    file_urls: [],
    github_url: "",
    content_text: "",
    youtube_url: "",
    tiktok_url: "",
    instagram_url: ""
  });
  const [originalData, setOriginalData] = useState({});
  const [currentTag, setCurrentTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    loadQuestData();
    loadCurrentUser();
  }, [questId]);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadQuestData = async () => {
    if (!questId) return;
    
    try {
      const questList = await Quest.filter({ id: questId });
      if (questList.length > 0) {
        const questObj = questList[0];
        setQuest(questObj);
        
        const data = {
          title: questObj.title || "",
          description: questObj.description || "",
          tags: questObj.tags || [],
          file_urls: questObj.file_urls || [],
          github_url: questObj.github_url || "",
          content_text: questObj.content_text || "",
          youtube_url: questObj.youtube_url || "",
          tiktok_url: questObj.tiktok_url || "",
          instagram_url: questObj.instagram_url || ""
        };
        
        setQuestData(data);
        setOriginalData(data);
      }
    } catch (error) {
      console.error("Error loading quest:", error);
    }
  };

  useEffect(() => {
    if (currentUser && quest) {
      const isCreator = currentUser.email === quest.created_by;
      const isCollaborator = quest.collaborators && quest.collaborators.includes(currentUser.email);
      setCanEdit(isCreator || isCollaborator);
    }
  }, [currentUser, quest]);

  const handleInputChange = (field, value) => {
    setQuestData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !questData.tags.includes(currentTag.trim())) {
      setQuestData(prev => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }));
      setCurrentTag("");
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadPromises = files.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map(result => result.file_url);

      setQuestData(prev => ({
        ...prev,
        file_urls: [...prev.file_urls, ...fileUrls]
      }));
    } catch (error) {
      console.error("Error uploading files:", error);
    }
    setUploadingFiles(false);
  };

  const createChangeLog = async (changes) => {
    if (!currentUser || changes.length === 0) return;

    const changeMessages = changes.map(change => 
      `@${currentUser.email.split('@')[0]} changed ${change.field} from "${change.from}" to "${change.to}"`
    );

    for (const message of changeMessages) {
      await QuestLog.create({
        quest_id: questId,
        action_type: "updated",
        message: message,
        user_email: currentUser.email,
        metadata: { edit_timestamp: new Date().toISOString() }
      });
    }
  };

  const detectChanges = () => {
    const changes = [];
    
    if (originalData.title !== questData.title) {
      changes.push({ field: "title", from: originalData.title, to: questData.title });
    }
    if (originalData.description !== questData.description) {
      changes.push({ field: "description", from: originalData.description.slice(0, 50) + "...", to: questData.description.slice(0, 50) + "..." });
    }
    if (originalData.content_text !== questData.content_text) {
      changes.push({ field: "content", from: "previous content", to: "updated content" });
    }
    if (originalData.github_url !== questData.github_url) {
      changes.push({ field: "github_url", from: originalData.github_url || "none", to: questData.github_url || "none" });
    }
    if (JSON.stringify(originalData.tags) !== JSON.stringify(questData.tags)) {
      changes.push({ field: "tags", from: originalData.tags.join(", ") || "none", to: questData.tags.join(", ") || "none" });
    }
    if (JSON.stringify(originalData.file_urls) !== JSON.stringify(questData.file_urls)) {
      changes.push({ field: "attachments", from: `${originalData.file_urls.length} files`, to: `${questData.file_urls.length} files` });
    }
    if (originalData.youtube_url !== questData.youtube_url) {
      changes.push({ field: "youtube_url", from: originalData.youtube_url || "none", to: questData.youtube_url || "none" });
    }
    if (originalData.tiktok_url !== questData.tiktok_url) {
      changes.push({ field: "tiktok_url", from: originalData.tiktok_url || "none", to: questData.tiktok_url || "none" });
    }
    if (originalData.instagram_url !== questData.instagram_url) {
      changes.push({ field: "instagram_url", from: originalData.instagram_url || "none", to: questData.instagram_url || "none" });
    }

    return changes;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    
    setIsSubmitting(true);
    try {
      const changes = detectChanges();
      
      await Quest.update(questId, questData);
      
      // Create change log entries
      await createChangeLog(changes);
      
      navigate(createPageUrl("QuestDetail") + "?id=" + questId);
    } catch (error) {
      console.error("Error updating quest:", error);
    }
    setIsSubmitting(false);
  };

  if (!quest) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="creator-card h-96 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to edit this post.</p>
          <Button onClick={() => navigate(-1)} className="creator-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:bg-gray-100 h-8 w-8 md:h-10 md:w-10"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Edit Post
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Make changes to your post. All edits will be tracked.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Main Content Form */}
          <Card className="creator-card">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-3 text-lg md:text-xl">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                Edit {quest.quest_type}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <Input
                value={questData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Post title..."
                className="text-base md:text-lg font-medium border-0 border-b-2 border-gray-200 focus:border-gray-400 shadow-none rounded-none px-1 py-2 md:py-3"
                required
              />
              
              <Textarea
                value={questData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Post description..."
                rows={4}
                className="bg-gray-50 border-gray-200 text-gray-900 resize-none text-sm md:text-base"
                required
              />

              {/* Content Editor for files */}
              {quest.quest_type === "file" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">File Content</label>
                  <Textarea
                    value={questData.content_text}
                    onChange={(e) => handleInputChange("content_text", e.target.value)}
                    placeholder="File content..."
                    rows={12}
                    className="bg-white border-gray-200 text-gray-900 resize-none font-mono text-sm"
                  />
                </div>
              )}

              {/* GitHub URL */}
              {(quest.quest_type === 'folder' || questData.github_url) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">GitHub Repository URL</label>
                  <Input
                    placeholder="https://github.com/username/repository"
                    value={questData.github_url}
                    onChange={(e) => handleInputChange('github_url', e.target.value)}
                  />
                </div>
              )}

              {/* File attachments */}
              {questData.file_urls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 font-medium">Attachments:</p>
                  <div className="grid gap-2">
                    {questData.file_urls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span>File {index + 1}</span>
                        </div>
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="ghost"
                          onClick={() => {
                            const newUrls = questData.file_urls.filter((_, i) => i !== index);
                            handleInputChange("file_urls", newUrls);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Files */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="creator-btn-secondary text-sm"
                  disabled={uploadingFiles}
                >
                  <Upload className="w-4 h-4" />
                  {uploadingFiles ? "Uploading..." : "Add Files"}
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  multiple 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="creator-card">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white text-lg">Social Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                <Input
                  placeholder="YouTube URL"
                  value={questData.youtube_url}
                  onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Clapperboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                <Input
                  placeholder="TikTok URL"
                  value={questData.tiktok_url}
                  onChange={(e) => handleInputChange('tiktok_url', e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                <Input
                  placeholder="Instagram URL"
                  value={questData.instagram_url}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="creator-card">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Add tag..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  className="bg-gray-50 border-gray-200"
                />
                <Button type="button" onClick={handleAddTag} className="creator-btn-secondary">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {questData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => setQuestData(prev => ({ 
                        ...prev, 
                        tags: prev.tags.filter(t => t !== tag) 
                      }))} 
                      className="ml-1.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="creator-btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="creator-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
