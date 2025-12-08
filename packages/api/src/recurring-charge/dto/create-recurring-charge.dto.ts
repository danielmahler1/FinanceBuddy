export class CreateRecurringChargeDto {
  accountId!: string;
  type!: string;
  amount!: number;
  vendor!: string;
  interval!: string;
  dayOfMonth!: number;
  monthOfYear?: number;
  startDate?: Date;
  endDate?: Date;
  status?: boolean;
}

