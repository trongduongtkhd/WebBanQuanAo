import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ChatReply, ChatRequest } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private readonly http: HttpClient) {}

  send(request: ChatRequest): Observable<ApiResponse<ChatReply>> {
    return this.http.post<ApiResponse<ChatReply>>(`${environment.apiUrl}/chat`, request)
      .pipe(timeout(55000));
  }
}
