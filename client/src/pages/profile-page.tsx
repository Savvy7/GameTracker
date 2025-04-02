import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  UserCircle, 
  Mail, 
  User as UserIcon, 
  ArrowLeft, 
  Edit,
  Save,
  Lock
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

// Profile form schema
const profileSchema = z.object({
  displayName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatarUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, updateProfileMutation, changePasswordMutation } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
      bio: user?.bio || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Handle profile update
  const onProfileSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values, {
      onSuccess: () => {
        setEditMode(false);
      }
    });
  };
  
  // Handle password change
  const onPasswordSubmit = (values: PasswordFormValues) => {
    changePasswordMutation.mutate(values, {
      onSuccess: () => {
        passwordForm.reset();
      }
    });
  };
  
  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-5">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="flex flex-col items-center pt-6">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.displayName || user.username} 
                  className="w-32 h-32 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                  <UserCircle className="w-24 h-24 text-gray-500" />
                </div>
              )}
              <h2 className="text-xl font-bold">{user.displayName || user.username}</h2>
              <p className="text-sm text-gray-400">@{user.username}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-4">
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      Manage how your profile appears to other users
                    </CardDescription>
                  </div>
                  <Button
                    variant={editMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                    disabled={updateProfileMutation.isPending}
                  >
                    {editMode ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Done
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <Input 
                                  {...field} 
                                  disabled={!editMode}
                                  className="bg-gray-700 border-gray-600" 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <UserIcon className="h-4 w-4 text-gray-500" />
                                <Input 
                                  {...field} 
                                  disabled={!editMode}
                                  className="bg-gray-700 border-gray-600" 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              This is the name displayed to other users.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="avatarUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Avatar URL</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                disabled={!editMode}
                                className="bg-gray-700 border-gray-600" 
                              />
                            </FormControl>
                            <FormDescription>
                              Enter a URL for your profile picture.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                disabled={!editMode}
                                placeholder="Tell us about yourself and your gaming preferences..."
                                className="min-h-[100px] bg-gray-700 border-gray-600" 
                              />
                            </FormControl>
                            <FormDescription>
                              Write a short bio that will appear on your profile.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {editMode && (
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account password and security options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-medium flex items-center mb-4">
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </h3>
                  <Separator className="my-4" />
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                {...field} 
                                className="bg-gray-700 border-gray-600" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                {...field} 
                                className="bg-gray-700 border-gray-600" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                {...field} 
                                className="bg-gray-700 border-gray-600" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}