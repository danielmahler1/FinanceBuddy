export class UpdateRecurringChargeDto {
  accountId?: string;
  type?: string;
  amount?: number;
  interval?: string;
  endDate?: Date;
  status?: boolean;
}

