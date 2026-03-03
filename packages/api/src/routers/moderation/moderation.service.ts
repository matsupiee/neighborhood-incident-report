// TODO: Phase 2-3, 2-4, 5-3 で実装
// モデレーター操作のビジネスロジック

export async function listPendingPosts() {
  // TODO: Phase 2-3 で実装（モデレーター限定）
  // status: PENDING の Post 一覧を返す
}

export async function approvePost(_input: { postId: string }) {
  // TODO: Phase 2-4 で実装
  // status → PUBLISHED、publishedAt → now()
}

export async function rejectPost(_input: { postId: string }) {
  // TODO: Phase 2-4 で実装
  // status → HIDDEN
}

export async function banUser() {
  // TODO: Phase 5-3 で実装
  // UserRestriction を作成してユーザーを BAN
}
