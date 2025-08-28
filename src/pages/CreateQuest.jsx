
import React, { useState, useRef, useEffect } from "react";
import { Quest, User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Upload,
  Folder,
  FileText,
  X,
  Plus,
  Github,
  MessageSquare,
  Link as LinkIcon,
  Youtube,
  Instagram,
  Clapperboard,
  Globe,
  Lock
} from "lucide-react";

const TypeSelector = ({ selectedType, onSelectType, disabled }) => {
  const types = [
    { value: 'discussion', label: 'Discussion', icon: MessageSquare },
    { value: 'file', label: 'File', icon: FileText },
    { value: 'folder', label: 'Folder', icon: Folder },
  ];

  return (
    <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
      {types.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => !disabled && onSelectType(value)}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedType === value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
};


export default function CreateQuest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get('parent');
  const guildId = searchParams.get('guildId'); // For creating quests inside a guild/party
  const linkDiscussionId = searchParams.get('linkDiscussion');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [questData, setQuestData] = useState({
    title: "",
    description: "",
    quest_type: parentId ? "file" : "discussion",
    is_public: true, // Default to public
    party_id: guildId || null,
    tags: [],
    file_urls: [],
    github_url: "",
    content_text: "",
    parent_quest_id: parentId || "",
    linked_discussion_id: linkDiscussionId || "",
    youtube_url: "",
    tiktok_url: "",
    instagram_url: ""
  });

  const [currentTag, setCurrentTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  const [linkedDiscussion, setLinkedDiscussion] = useState(null);

  // New useEffect: Load linked discussion data if linkDiscussionId is present
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        // Set default privacy based on user settings
        const isPublicByDefault = user?.default_post_privacy === 'public';
        setQuestData(prev => ({ ...prev, is_public: isPublicByDefault }));

        if (linkDiscussionId) {
          // Assuming Quest.filter is available to fetch quests by ID
          const discussions = await Quest.filter({ id: linkDiscussionId });
          if (discussions.length > 0) {
            const discussion = discussions[0];
            setLinkedDiscussion(discussion);
            setQuestData(prev => ({
              ...prev,
              title: discussion.title + " (File Version)", // Pre-fill title
              description: `This file is a repost of @${discussion.created_by?.split('@')[0] || 'unknown'} discussion "${discussion.title}"\n\nOriginal discussion: ${discussion.description}`, // Pre-fill description
              quest_type: "file", // Force type to file
              linked_discussion_id: discussion.id,
              content_text: discussion.content_text || discussion.description, // Use content_text or description from original
              is_public: discussion.is_public // Inherit privacy from original
            }));
          } else {
            console.warn("Linked discussion not found:", linkDiscussionId);
            // Optionally, clear linkDiscussionId or redirect if not found
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };
    loadInitialData();
  }, [linkDiscussionId]); // Dependency on linkDiscussionId

  // Determine if we are linking a discussion (used for type and text changes)
  const isLinkingDiscussion = !!linkDiscussionId; 
  const isInParty = !!guildId;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalQuestData = { ...questData };
      if (isInParty) {
        finalQuestData.is_public = false; // Posts in a party are always private
        finalQuestData.party_id = guildId;
      }
      
      const newQuest = await Quest.create(finalQuestData);
      
      // New: If this is a file repost of a discussion, update the original discussion
      if (linkDiscussionId && linkedDiscussion) {
        // Assuming Quest.update is available to update an existing quest
        await Quest.update(linkDiscussionId, {
          parent_quest_id: newQuest.id // Link the original discussion to the new file post
        });
      }
      
      if (guildId) {
        navigate(createPageUrl("GuildDetail") + "?id=" + guildId);
      } else if (parentId) {
        navigate(createPageUrl("QuestDetail") + "?id=" + parentId);
      } else {
        navigate(createPageUrl("Dashboard"));
      }
    } catch (error) {
      console.error("Error creating quest:", error);
    }
    setIsSubmitting(false);
  };

  const getPostTypeLabel = () => {
    switch (questData.quest_type) {
      case "discussion": return "Discussion";
      case "file": return "File";
      case "folder": return "Folder";
      default: return "Post";
    }
  };

  const isInContainer = !!parentId;
  

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 h-8 w-8 md:h-10 md:w-10"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {isLinkingDiscussion ? "Create File from Discussion" : 
               isInParty ? "Create Party Post" :
               isInContainer ? "Add to Container" : "Create New Post"}
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
              {isLinkingDiscussion 
                ? "Convert your discussion into a structured file post"
                : isInParty
                ? "Share within your party"
                : isInContainer 
                ? "Add files, folders, or discussions to this container"
                : "Share your work, ideas, or start a project"}
            </p>
          </div>
        </div>

        {isLinkingDiscussion && linkedDiscussion && (
          <Card className="creator-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-blue-600" />
                Linking to Discussion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200">{linkedDiscussion.title}</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {linkedDiscussion.description.length > 200 
                    ? linkedDiscussion.description.slice(0, 200) + "..." 
                    : linkedDiscussion.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <Card className="creator-card">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
                 What would you like to create?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TypeSelector 
                selectedType={questData.quest_type} 
                onSelectType={(type) => handleInputChange('quest_type', type)}
                disabled={isLinkingDiscussion}
              />
            </CardContent>
          </Card>

          <Card className="creator-card">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-3 text-lg md:text-xl">
                {questData.quest_type === 'discussion' ? (
                  <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                ) : questData.quest_type === 'folder' ? (
                  <Folder className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                ) : (
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                )}
                New {getPostTypeLabel()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Label htmlFor="is_public" className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                  {questData.is_public ? <Globe className="w-4 h-4 text-green-600"/> : <Lock className="w-4 h-4 text-orange-600" />}
                  <span>{questData.is_public ? "Public Post" : "Private Post"}</span>
                </Label>
                <Switch
                  id="is_public"
                  checked={questData.is_public}
                  onCheckedChange={(checked) => handleInputChange('is_public', checked)}
                  disabled={isInParty}
                />
              </div>
              {isInParty && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 -mt-2">
                  Posts in a party are always private.
                </p>
              )}
              <Input
                value={questData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder={
                  questData.quest_type === 'folder' ? "Folder or container name..." :
                  questData.quest_type === 'file' ? "File or document name..." :
                  "Give your post a clear, descriptive title..."
                }
                className="text-base md:text-lg font-medium border-0 border-b-2 border-gray-200 focus:border-gray-400 shadow-none rounded-none px-1 py-2 md:py-3"
                required
              />
              <Textarea
                value={questData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={
                  questData.quest_type === 'folder' ? "Explain the purpose of this folder, its contents, or tasks..." :
                  questData.quest_type === 'file' ? "Describe the file content, purpose, or context..." :
                  "Share your thoughts, ask questions, or start a discussion..."
                }
                rows={4}
                className="bg-gray-50 border-gray-200 text-gray-900 resize-none text-sm md:text-base"
                required
              />

              {questData.quest_type === 'file' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Content (optional)</label>
                  <Textarea
                    value={questData.content_text}
                    onChange={(e) => handleInputChange("content_text", e.target.value)}
                    placeholder="Write your file content, or add more details here..."
                    rows={12}
                    className="bg-white border-gray-200 text-gray-900 resize-none font-mono text-sm"
                  />
                </div>
              )}

              {questData.file_urls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Attachments:</p>
                  <div className="grid gap-2">
                    {questData.file_urls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
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

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="creator-btn-secondary text-sm"
                      disabled={uploadingFiles}
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingFiles ? "Uploading..." : "Upload Files"}
                    </button>
                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="creator-btn-secondary text-sm"
                      disabled={uploadingFiles}
                    >
                      <Folder className="w-4 h-4" />
                      {uploadingFiles ? "Uploading..." : "Upload Folder"}
                    </button>
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      multiple 
                      onChange={(e) => handleFileUpload(e)} 
                      className="hidden" 
                    />
                    <input 
                      ref={folderInputRef} 
                      type="file" 
                      onChange={(e) => handleFileUpload(e)} 
                      className="hidden" 
                      {...({webkitdirectory: ""})}
                    />
                </div>
                <div className="relative">
                     <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                     <Input
                        placeholder="Link GitHub repository... (optional)"
                        value={questData.github_url}
                        onChange={(e) => handleInputChange('github_url', e.target.value)}
                        className="pl-10"
                    />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="creator-card">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white text-lg">Link Social Content (Optional)</CardTitle>
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
              <CardTitle className="text-gray-900 dark:text-white text-lg">Add Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Help others discover your work</p>
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
                  <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
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
              {isSubmitting ? "Creating..." : 
               isLinkingDiscussion ? "Create File Version" : 
               isInParty ? "Create Party Post" :
               isInContainer ? "Add to Container" : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
