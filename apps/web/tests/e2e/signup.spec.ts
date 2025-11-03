import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Checkbox,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Textarea,
  Stack,
  Link,
  useToast,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../services/api';
import { SignupFieldsArtist } from './Auth/SignupFieldsArtist';

// Schemas for validation
const artistProfileSchema = z.object({
  socialProfileUrl: z.string().url().refine(
    (url) => {
      const allowedProviders = [
        'soundcloud.com',
        'bandcamp.com',
        'mixcloud.com',
        'open.spotify.com',
        'youtube.com',
        'beatport.com',
      ];
      return allowedProviders.some((provider) => url.includes(provider));
    },
    { message: 'Invalid social profile URL. Please use SoundCloud, Bandcamp, Mixcloud, Spotify, YouTube, or Beatport.' }
  ),
  genre: z.string().min(1, 'Primary genre is required.'),
  techRider: z.any().optional(), // Placeholder for file upload
});

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  artistName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  region: z.string().min(1, 'Region is required'),
  isArtist: z.boolean(),
  artistProfile: artistProfileSchema.optional(),
});

type SignupSchemaType = z.infer<typeof signupSchema>;

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

export const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onLoginClick }) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isArtistChecked, setIsArtistChecked] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      isArtist: false,
    },
  });

  const watchedIsArtist = watch('isArtist');

  const handleArtistCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsArtistChecked(e.target.checked);
    setValue('isArtist', e.target.checked);
    if (!e.target.checked) {
      // Clear artist profile fields if unchecked
      setValue('artistProfile', undefined);
      setValue('artistName', '');
    }
  };

  const onSubmit = async (data: SignupSchemaType) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        artistProfile: data.isArtist ? data.artistProfile : undefined,
      };
      await api.post('/auth/signup', payload);

      toast({
        title: 'Signup Successful',
        description: 'Please check your email for verification.',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
      reset();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Signup Failed',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Sign Up</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Stack spacing={4}>
            <FormControl isInvalid={!!errors.firstName}>
              <FormLabel htmlFor="firstName">First Name</FormLabel>
              <Input id="firstName" {...register('firstName')} />
              <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.lastName}>
              <FormLabel htmlFor="lastName">Last Name</FormLabel>
              <Input id="lastName" {...register('lastName')} />
              <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <Checkbox
                id="artist-checkbox"
                isChecked={watchedIsArtist}
                onChange={handleArtistCheckboxChange}
                {...register('isArtist')}
              >
                I am an Artist
              </Checkbox>
            </FormControl>

            {watchedIsArtist && (
              <SignupFieldsArtist
                register={register}
                errors={errors}
                setValue={setValue}
                isArtist={watchedIsArtist}
              />
            )}

            <FormControl isInvalid={!!errors.email}>
              <FormLabel htmlFor="email">Email Address</FormLabel>
              <Input id="email" {...register('email')} />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.password}>
              <FormLabel htmlFor="password">Password</FormLabel>
              <Input id="password" type="password" {...register('password')} />
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
              <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.region}>
              <FormLabel htmlFor="region">Region</FormLabel>
              <Input id="region" {...register('region')} />
              <FormErrorMessage>{errors.region?.message}</FormErrorMessage>
            </FormControl>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button isLoading={isSubmitting || isLoading} onClick={handleSubmit(onSubmit)} colorScheme="brand" mr={3}>
            {watchedIsArtist ? 'Sign Up as Artist' : 'Sign Up'}
          </Button>
          <Button onClick={onLoginClick}>Already have an account? Log In</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};