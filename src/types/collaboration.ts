export interface BoardMeta {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Collaborator {
  id: string;
  board_id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  added_at: string;
}

export interface Invite {
  id: string;
  board_id: string;
  inviter_id: string;
  invitee_email: string;
  role: "editor" | "viewer";
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  expires_at: string;
  inviter_name?: string;
  board_name?: string;
}
