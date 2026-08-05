CREATE INDEX IF NOT EXISTS idx_profiles_username ON watchly.profiles(username);
CREATE INDEX IF NOT EXISTS idx_media_tmdb ON watchly.media(tmdb_id, media_type);
CREATE INDEX IF NOT EXISTS idx_user_media_user ON watchly.user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_media ON watchly.user_media(media_id);
CREATE INDEX IF NOT EXISTS idx_user_media_status ON watchly.user_media(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lists_user ON watchly.lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list ON watchly.list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_profile_featured_user ON watchly.profile_featured_media(user_id);
