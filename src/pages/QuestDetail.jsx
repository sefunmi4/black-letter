
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Quest, User, QuestComment, QuestLike } from "@/api/entities";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Folder,
  MessageSquare,
  Github,
  Star,
  Clock,
  Users,
  UserPlus,
  Eye,
  Plus,
  Download,
  ExternalLink,
  ArrowRight,
  Edit,
  Youtube,
  Instagram,
  Clapperboard,
  Heart,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CommentForm from "../components/quest_detail/CommentForm";
import CommentCard from "../components/quest_detail/CommentCard";
import StatusToggle from "../components/shared/StatusToggle";
import { getUserDisplayName } from "../components/shared/UserDisplay";

const questTypeIcons = {
  discussion: MessageSquare,
  file: FileText,
  folder: Folder
};

const questTypeColors = {
  discussion: "bg-blue-100 text-blue-700 border-blue-200",
  file: "bg-green-100 text-green-700 border-green-200",
  folder: "bg-purple-100 text-purple-700 border-purple-200"
};

const roleTypeColors = {
  creator: "bg-purple-100 text-purple-700",
  developer: "bg-blue-100 text-blue-700",
  freelancer: "bg-green-100 text-green-700",
  explorer: "bg-orange-100 text-orange-700"
};

export default function QuestDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const questId = searchParams.get('id');
  const discussionRef = useRef(null);

  const [quest, setQuest] = useState(null);
  const [subQuests, setSubQuests] = useState([]);
  const [linkedDiscussion, setLinkedDiscussion] = useState(null);
  const [parentQuest, setParentQuest] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [currentUserLike, setCurrentUserLike] = useState(null);

  const loadQuestData = useCallback(async () => {
    if (!questId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const questData = await Quest.filter({ id: questId });

      if (questData.length > 0) {
        const currentQuest = questData[0];
        
        const [
          subQuestData, 
          commentsData, 
          likesData, 
          parentData, 
          linkedDiscussionData,
          me
        ] = await Promise.all([
          Quest.filter({ parent_quest_id: questId }, "-created_date"),
          QuestComment.filter({ quest_id: questId }, "-created_date"),
          QuestLike.filter({ quest_id: questId }),
          currentQuest.parent_quest_id ? Quest.filter({ id: currentQuest.parent_quest_id }) : Promise.resolve([]),
          currentQuest.linked_discussion_id ? Quest.filter({ id: currentQuest.linked_discussion_id }) : Promise.resolve([]),
          User.me().catch(() => null)
        ]);
        
        setCurrentUser(me);

        // Try to get creator user data
        let creatorUser = null;
        try {
          const allUsers = await User.list();
          creatorUser = allUsers.find(user => user.email === currentQuest.created_by);
        } catch (error) {
          console.warn("Cannot fetch creator data:", error);
        }

        const ratedComments = commentsData.filter(c => c.rating);
        const averageRating = ratedComments.length > 0
          ? ratedComments.reduce((sum, c) => sum + c.rating, 0) / ratedComments.length
          : 0;
        
        const questWithCounts = {
          ...currentQuest,
          creator_user: creatorUser,
          like_count: likesData.length,
          comment_count: commentsData.length,
          rating_count: ratedComments.length,
          average_rating: averageRating
        };

        setQuest(questWithCounts);
        setSubQuests(subQuestData);
        setComments(commentsData);
        setParentQuest(parentData.length > 0 ? parentData[0] : null);
        setLinkedDiscussion(linkedDiscussionData.length > 0 ? linkedDiscussionData[0] : null);

        if (me) {
          const userLikeRecord = likesData.find(like => like.user_email === me.email);
          if (userLikeRecord) {
            setIsLiked(true);
            setCurrentUserLike(userLikeRecord);
          } else {
            setIsLiked(false);
            setCurrentUserLike(null);
          }
        }

      } else {
        setQuest(null);
        setSubQuests([]);
        setComments([]);
        setLinkedDiscussion(null);
        setParentQuest(null);
      }
    } catch (error) {
      console.error("Error loading quest:", error);
      setQuest(null);
      setSubQuests([]);
      setComments([]);
      setLinkedDiscussion(null);
      setParentQuest(null);
    }
    setIsLoading(false);
  }, [questId]); // Dependency: questId

  useEffect(() => {
    loadQuestData();
  }, [loadQuestData]); // Dependency: loadQuestData

  useEffect(() => {
    // User.me().then(setCurrentUser).catch(() => setCurrentUser(null)); // Handled inside loadQuestData now for single source of truth
  }, []); // Empty dependency array, runs once on mount

  useEffect(() => {
    if (!isLoading && (searchParams.get('action') === 'feedback' || window.location.hash === '#discussion') && discussionRef.current) {
      discussionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isLoading, searchParams]);

  const handleCommentPosted = async (commentData) => {
    if (!currentUser) return;

    try {
      await QuestComment.create({
        ...commentData,
        quest_id: quest.id,
        user_email: currentUser.email
      });

      // Refresh all quest data to update comments, counts, and ratings
      loadQuestData();

    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert("You must be logged in to like a quest.");
      return;
    }

    // Store original values for potential rollback
    const originalIsLiked = isLiked;
    const originalLikeCount = quest.like_count || 0;
    
    // Calculate new values
    const newIsLiked = !originalIsLiked;
    const newLikeCount = newIsLiked 
      ? originalLikeCount + 1 
      : Math.max(0, originalLikeCount - 1); // Ensure count doesn't go below 0

    // Optimistic update
    setIsLiked(newIsLiked);
    setQuest(prev => ({
        ...prev,
        like_count: newLikeCount
    }));

    try {
        if (newIsLiked) {
            // Adding a like
            const newLike = await QuestLike.create({ 
              quest_id: quest.id, 
              user_email: currentUser.email 
            });
            setCurrentUserLike(newLike);
        } else {
            // Removing a like
            if (currentUserLike) {
                await QuestLike.delete(currentUserLike.id);
                setCurrentUserLike(null);
            } else {
                // Fallback: find and delete any existing like by this user
                const existingLikes = await QuestLike.filter({ 
                  quest_id: quest.id, 
                  user_email: currentUser.email 
                });
                if (existingLikes.length > 0) {
                    await QuestLike.delete(existingLikes[0].id);
                }
            }
        }
    } catch (error) {
        console.error("Failed to update like:", error);
        // Revert optimistic update on error
        setIsLiked(originalIsLiked);
        setQuest(prev => ({
            ...prev,
            like_count: originalLikeCount
        }));
        alert("Failed to update like. Please try again.");
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!quest) return;
    const updateData = { status: newStatus };
    if (newStatus === 'completed') {
        updateData.request_type = 'none';
    }
    await Quest.update(quest.id, updateData);
    const updatedQuestData = await Quest.filter({ id: questId });
    if (updatedQuestData.length > 0) {
      setQuest(updatedQuestData[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="creator-card h-96 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quest not found</h1>
          <Button onClick={() => navigate(-1)} className="creator-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const QuestIcon = questTypeIcons[quest.quest_type];
  const isCreator = currentUser && currentUser.email === quest.created_by;
  const hasOpenRequest = quest.request_type !== 'none';
  const hasSocialLinks = quest.youtube_url || quest.tiktok_url || quest.instagram_url;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="creator-card p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700">
                  <QuestIcon className="w-7 h-7 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {quest.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                    <span>by {getUserDisplayName(quest.creator_user || quest.created_by)}</span>
                    <span>·</span>
                    <span>{format(new Date(quest.created_date), "MMM d, yyyy")}</span>
                    {quest.average_rating > 0 && (
                      <>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{quest.average_rating.toFixed(1)}</span>
                          <span className="text-gray-400 dark:text-gray-500">({quest.rating_count} ratings)</span>
                        </div>
                      </>
                    )}
                    {quest.collaborators && quest.collaborators.length > 0 && (
                      <>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{quest.collaborators.length + 1} team {quest.collaborators.length + 1 === 1 ? 'member' : 'members'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Parent Quest Link */}
              {parentQuest && (
                <Link to={createPageUrl("QuestDetail") + "?id=" + parentQuest.id}>
                  <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 gap-2 border px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-600">
                    <Folder className="w-4 h-4" />
                    In: {parentQuest.title}
                  </Badge>
                </Link>
              )}

              {/* Linked Discussion Tag */}
              {linkedDiscussion && (
                <Link to={createPageUrl("QuestDetail") + "?id=" + linkedDiscussion.id}>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-2 border px-3 py-2 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900">
                    <MessageSquare className="w-4 h-4" />
                    From Discussion
                  </Badge>
                </Link>
              )}

              {/* Quest Type Badge */}
              <Badge className={`${questTypeColors[quest.quest_type]} border text-sm capitalize px-3 py-1`}>
                {quest.quest_type}
              </Badge>

              {quest.github_url && (
                <a href={quest.github_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Github className="w-4 h-4 mr-2" />
                    View on GitHub
                  </Button>
                </a>
              )}

              {hasOpenRequest && quest.status !== 'completed' && (
                <Badge className="bg-green-50 text-green-700 border-green-200 gap-2 border px-3 py-2">
                  {quest.request_type === 'team_help' ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Team Wanted
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Feedback Wanted
                    </>
                  )}
                </Badge>
              )}

              {isCreator && (
                <div className="flex items-center gap-2">
                  <Link to={createPageUrl("EditQuest") + "?id=" + quest.id}>
                    <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <StatusToggle status={quest.status} isCreator={isCreator} onStatusChange={handleStatusChange} />
                </div>
              )}
            </div>
          </div>

          {/* Tags and Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {quest.tags && quest.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {quest.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${
                      isLiked ? "text-red-500" : ""
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="font-medium">{quest.like_count || 0}</span>
                </button>
                <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium">{quest.comment_count || 0}</span>
                </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="capitalize">{quest.status.replace('_', ' ')}</span>
              </div>
              {quest.completion_percentage > 0 && (
                <div className="flex items-center gap-1">
                  <span>{quest.completion_percentage}% complete</span>
                </div>
              )}
              {quest.collaborators && quest.collaborators.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{quest.collaborators.length + 1} team {quest.collaborators.length + 1 === 1 ? 'member' : 'members'}</span>
                </div>
              )}
            </div>
          </div>

          {quest.request_type === 'team_help' && quest.team_roles && quest.team_roles.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-3">Looking for team members:</h3>
              <div className="flex flex-wrap gap-2">
                {quest.team_roles.map((role, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Badge className={`${roleTypeColors[role.role_type]} border text-sm`}>
                      {role.count} {role.role_type}{role.count > 1 ? 's' : ''}
                    </Badge>
                    {role.description && (
                      <span className="text-sm text-blue-700 dark:text-blue-300">- {role.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Social Links */}
        {hasSocialLinks && (
          <div className="creator-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Related Content</h2>
            <div className="flex flex-wrap gap-3">
              {quest.youtube_url && (
                <a href={quest.youtube_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700">
                    <Youtube className="w-4 h-4 mr-2" />
                    YouTube
                  </Button>
                </a>
              )}
              {quest.tiktok_url && (
                <a href={quest.tiktok_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/50 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-700">
                    <Clapperboard className="w-4 h-4 mr-2" />
                    TikTok
                  </Button>
                </a>
              )}
              {quest.instagram_url && (
                <a href={quest.instagram_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/50 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-300 dark:hover:border-pink-700">
                    <Instagram className="w-4 h-4 mr-2" />
                    Instagram
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Linked Discussion Preview */}
        {linkedDiscussion && (
          <div className="creator-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Original Discussion
            </h2>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <Link to={createPageUrl("QuestDetail") + "?id=" + linkedDiscussion.id}>
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 hover:text-blue-700 dark:hover:text-blue-400 mb-2">
                  {linkedDiscussion.title}
                </h3>
              </Link>
              <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                {linkedDiscussion.description ? `${linkedDiscussion.description.slice(0, 300)}${linkedDiscussion.description.length > 300 ? '...' : ''}` : 'No description provided.'}
              </p>
              <div className="mt-3">
                <Link to={createPageUrl("QuestDetail") + "?id=" + linkedDiscussion.id}>
                  <Button size="sm" variant="outline" className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900">
                    View Full Discussion
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="creator-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {quest.description}
            </p>
          </div>
        </div>

        {quest.quest_type === "file" && quest.content_text && (
          <div className="creator-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">File Content</h2>
              <Button variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                {quest.content_text}
              </pre>
            </div>
          </div>
        )}

        {quest.file_urls && quest.file_urls.length > 0 && (
          <div className="creator-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Attached Files</h2>
            <div className="grid gap-3">
              {quest.file_urls.map((url, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Attachment {index + 1}</span>
                  </div>
                  <Button variant="outline" size="sm" asChild className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(quest.quest_type === "folder") && (
          <div className="creator-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Folder Contents
              </h2>
              {isCreator && (
                <Link to={createPageUrl("CreateQuest") + "?parent=" + quest.id}>
                  <Button className="creator-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Content
                  </Button>
                </Link>
              )}
            </div>

            {subQuests.length > 0 ? (
              <div className="space-y-3">
                {subQuests.map((subQuest) => {
                  const SubIcon = questTypeIcons[subQuest.quest_type];
                  return (
                    <Link
                      key={subQuest.id}
                      to={createPageUrl("QuestDetail") + "?id=" + subQuest.id}
                      className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                          <SubIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{subQuest.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{subQuest.description}</p>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(subQuest.created_date), "MMM d")}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Folder className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">Empty folder</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {isCreator
                    ? "Add files, folders, or discussions to organize your work"
                    : "This folder doesn't have any content yet"
                  }
                </p>
                {isCreator && (
                  <Link to={createPageUrl("CreateQuest") + "?parent=" + quest.id}>
                    <Button className="creator-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Item
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        <div id="discussion" ref={discussionRef} className="creator-card p-6 scroll-mt-20">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Discussion & Reviews ({comments.length})</h2>

          <div className="space-y-4 mb-6">
            {comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentCard key={comment.id} comment={comment} />
                ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <p className="text-sm">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>

          <CommentForm quest={quest} onCommentPosted={handleCommentPosted} />
        </div>
      </div>
    </div>
  );
}
