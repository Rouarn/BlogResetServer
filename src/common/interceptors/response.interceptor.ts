import {
  Injectable,
  NestInterceptor,
  CallHandler,
  ExecutionContext,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponse, PaginatedResponse } from '../interfaces/response.interface';
import {
  SUCCESS_RESPONSE,
  DEFAULT_PAGINATION,
  PAGING_FIELDS,
} from '../constants/response.constant';

@Injectable()
export class ResponseInterceptor<T = any> implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T> | PaginatedResponse<T>> {
    return next.handle().pipe(
      map((rawData) => {
        const baseResponse = {
          code: SUCCESS_RESPONSE.CODE,
          message: SUCCESS_RESPONSE.MESSAGE,
        };

        const request = context.switchToHttp().getRequest();
        const params = this.getRequestParams(request);

        if (this.isPagingRequest(params)) {
          return {
            ...baseResponse,
            data: this.formatPaginatedData(rawData, params),
          } as PaginatedResponse<T>;
        }

        return {
          ...baseResponse,
          data: rawData,
        } as IResponse<T>;
      }),
    );
  }

  private getRequestParams(request: any): Record<string, any> {
    return {
      ...request.query,
      ...request.body,
      ...request.params,
    };
  }

  private isPagingRequest(params: Record<string, any>): boolean {
    return PAGING_FIELDS.every((field) => field in params);
  }

  private formatPaginatedData(rawData: any, params: Record<string, any>) {
    return {
      records: rawData.records || rawData.list || rawData.items || rawData,
      total: rawData.total ?? rawData.count ?? 0,
      current: Number(params.current) || DEFAULT_PAGINATION.MIN_PAGE,
      size: Number(params.size) || DEFAULT_PAGINATION.DEFAULT_PAGE_SIZE,
    };
  }
}
