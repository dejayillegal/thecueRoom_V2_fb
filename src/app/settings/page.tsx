
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { verifyArtistAction } from '@/app/actions/auth-actions';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/firebase/AuthProvider';

interface UserProfile {
  firstName?: string;
  lastName?: string;
  artistName?: string;
  region?: string;
  primaryGenre?: string;
  submittedLink?: string;
  verificationStatus?: 'unsubmitted' | 'queued' | 'passed' | 'failed' | 'needs_info';
}

export default function SettingsPage() {
  const { user } = useUser();
  const { auth } = useAuth();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const [formData, setFormData] = useState<UserProfile>({});
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [userProfile, user]);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSave = async () => {
    if (!user || !userProfileRef) return;
    setIsSaving(true);
    try {
      await updateDoc(userProfileRef, {
        ...formData,
      });
      toast({ title: 'Success', description: 'Profile updated successfully.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccountSave = async () => {
    if (!user || !auth) return;
    setIsSaving(true);
    try {
        if (currentPassword && newPassword) {
            if(!user.email) {
              throw new Error("User email is not available.");
            }
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setNewPassword('');
            toast({ title: 'Success', description: 'Password updated successfully.' });
        }
        
        if (email !== user.email) {
            await updateEmail(user, email);
            if (userProfileRef) {
                await updateDoc(userProfileRef, { email });
            }
            toast({ title: 'Success', description: 'Email updated. Please verify your new address.' });
        }
        
        setCurrentPassword('');

    } catch (error: any) {
        console.error('Error updating account:', error);
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: error.message || 'Failed to update account. Please re-check your current password.',
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleVerificationResubmit = async () => {
    if (!user || !userProfileRef || !formData.submittedLink) return;
    setIsSaving(true);
    try {
        await updateDoc(userProfileRef, { 
            submittedLink: formData.submittedLink,
            verificationStatus: 'queued',
        });
        // Non-blocking call to AI verification
        verifyArtistAction({ userId: user.uid, displayName: formData.artistName || user.displayName || '', socialUrl: formData.submittedLink });
        toast({ title: 'Success', description: 'Verification link has been resubmitted.' });

    } catch (error) {
        console.error('Error resubmitting verification:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to resubmit verification.',
        });
    } finally {
        setIsSaving(false);
    }
  };

  const getBadgeVariant = (status?: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch(status) {
        case 'passed': return 'default';
        case 'failed': return 'destructive';
        case 'queued': return 'secondary';
        default: return 'outline';
    }
  }


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, profile, and verification settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>
                This information will be displayed on your artist profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="artistName">Artist Name</Label>
                  <Input
                    id="artistName"
                    value={formData.artistName || ''}
                    onChange={(e) => handleInputChange('artistName', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="primaryGenre">Primary Genre</Label>
                  <Select
                    value={formData.primaryGenre || ''}
                    onValueChange={(value) => handleInputChange('primaryGenre', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="techno">Techno</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="electro">Electro</SelectItem>
                        <SelectItem value="leftfield">Leftfield</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="region">Region</Label>
                <Select
                    value={formData.region || ''}
                    onValueChange={(value) => handleInputChange('region', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="north-america">North America</SelectItem>
                        <SelectItem value="europe">Europe</SelectItem>
                        <SelectItem value="asia">Asia</SelectItem>
                        <SelectItem value="south-america">South America</SelectItem>
                        <SelectItem value="africa">Africa</SelectItem>
                        <SelectItem value="australia">Australia</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileSave} disabled={isSaving || isProfileLoading}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your email and password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Separator />
              <CardTitle className="text-lg">Change Password</CardTitle>
              <div className="space-y-1">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button onClick={handleAccountSave} disabled={isSaving || isProfileLoading}>
                {isSaving ? 'Saving...' : 'Save Account Settings'}
              </Button>
               <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        toast({ variant: 'destructive', title: 'Action not implemented', description: 'Account deletion is not yet available.'})
                    }}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle>Artist Verification</CardTitle>
              <CardDescription>
                Check your verification status or submit a new link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-accent">
                    <p>Current Status:</p>
                    <Badge variant={getBadgeVariant(formData.verificationStatus)} className="capitalize">{formData.verificationStatus || 'unsubmitted'}</Badge>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="socialUrl">Social Media / Profile URL</Label>
                    <Input id="socialUrl" value={formData.submittedLink || ''} onChange={(e) => handleInputChange('submittedLink', e.target.value)} placeholder="https://soundcloud.com/your-artist-name" />
                    <p className="text-xs text-muted-foreground pt-1">Provide a link to a public profile (SoundCloud, Spotify, Bandcamp, etc.) that clearly identifies you as the artist.</p>
                </div>
                 {formData.verificationStatus === 'failed' && (
                    <p className="text-sm text-destructive">Our AI couldn't verify your last submission. Please provide a clearer link and resubmit.</p>
                 )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleVerificationResubmit} disabled={isSaving || isProfileLoading || !formData.submittedLink}>
                {isSaving ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
            <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Choose what you want to be notified about. (UI Only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className='text-sm text-muted-foreground'>Notification settings coming soon.</p>
            </CardContent>
             <CardFooter>
              <Button disabled>Save Preferences</Button>
            </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
