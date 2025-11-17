export class CreateGoalDto {
  userId!: string;
  name!: string;
  description?: string;
  targetAmount!: number;
  currentAmount?: number;
  status?: string;
  category?: string;
  priority?: string;
  targetDate?: string;
}

