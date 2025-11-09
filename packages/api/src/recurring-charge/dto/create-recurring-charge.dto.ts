export class CreateRecurringChargeDto {
  accountId: string;
  type: string;
  amount: number;
  interval: string;
  endDate?: Date;
  status: boolean;
}

