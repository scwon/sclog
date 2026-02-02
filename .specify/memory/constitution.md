# Speckit Workflow Rules

Speckit 워크플로우에서 따라야 할 규칙.

기술 스택, 코딩 컨벤션, 라이브러리 선택 기준은 `CLAUDE.md`를 단일 소스 오브 트루스로 따른다.

## Task 분할

- task 하나가 파일 5개 이상 수정하면 분할할 것
- 각 task는 독립적으로 테스트 가능해야 함

## Acceptance Criteria 검증

- implement 완료 후 반드시 spec.md의 acceptance criteria와 대조 검증할 것
- 모든 criteria가 충족되지 않으면 완료로 표시하지 않음

## Clarify 규칙

- 불확실한 설계 결정이 나오면 구현 전에 `/speckit.clarify`로 돌아갈 것
- 가정하지 말고 질문할 것

## 새 기술/스킬 추가

작업 중 새로운 기술이나 구조가 필요한 경우:
1. 작업을 멈추고 사용자에게 필요성 설명
2. 사용자와 논의 후 결정
3. 결정된 내용을 `CLAUDE.md` 또는 새 skill로 추가
4. 작업 계속
