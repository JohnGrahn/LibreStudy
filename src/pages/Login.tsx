import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Container,
  Button,
  Stack,
  Text,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername: formData.emailOrUsername,
          password: formData.password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Update auth context with token
      login(data.token);
      
      notifications.show({
        title: 'Success',
        message: 'Login successful!',
        color: 'green',
      });
      
      navigate('/');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Login failed',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Welcome back!</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Don't have an account yet?{' '}
        <Anchor size="sm" component="button" onClick={() => navigate('/register')}>
          Create account
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email or Username"
              placeholder="Your email or username"
              required
              value={formData.emailOrUsername}
              onChange={(e) => setFormData({ ...formData, emailOrUsername: e.target.value })}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <Button type="submit" loading={loading}>
              Login
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
} 