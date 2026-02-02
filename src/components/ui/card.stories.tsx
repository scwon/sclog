import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';
import { Button } from './button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const BlogPost: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>React Server Components</CardTitle>
        <CardDescription>2024년 1월 15일</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          RSC가 프론트엔드 개발을 어떻게 바꾸고 있는지 알아봅니다.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm">
          더 읽기
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const Simple: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardContent className="pt-6">
        <p>Simple card with only content.</p>
      </CardContent>
    </Card>
  ),
};
