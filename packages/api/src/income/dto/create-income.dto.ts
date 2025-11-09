export class CreateIncomeDto {
  accountId: string;
  amount: number;
  interval?: string;
  endDate?: Date;
}

