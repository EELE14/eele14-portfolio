/* Copyright (c) 2026 eele14. All Rights Reserved. */

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  approved: boolean;
  blocked: boolean;
  ipAddress: string | null;
  createdAt: string;
}
