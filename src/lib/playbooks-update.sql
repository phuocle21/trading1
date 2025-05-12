-- SQL để cập nhật cấu trúc bảng playbooks nếu cần
-- Cập nhật tất cả bản ghi hiện có để đảm bảo trường content có cấu trúc phù hợp
UPDATE playbooks
SET content = COALESCE(content, '{}'::jsonb) || 
jsonb_build_object(
  'strategy', '',
  'timeframe', '',
  'setupCriteria', '',
  'entryTriggers', '',
  'exitRules', '',
  'riskManagement', '',
  'notes', ''
)
WHERE content IS NULL OR NOT (content ? 'strategy');
