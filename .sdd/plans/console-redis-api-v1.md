# Console Redis API v1 - Plan

## Status: complete

## Tasks

- [x] Create spec (`.sdd/specs/console-redis-api-v1.md`)
- [x] Create plan (`.sdd/plans/console-redis-api-v1.md`)
- [x] Install ioredis in console
- [x] Create `/api/redis/route.ts` server route
- [x] Delete `/api/rabbitmq/route.ts`
- [x] Update `lib/types.ts` -- remove RabbitMQ types, simplify domain types
- [x] Update `lib/api.ts` -- switch to Redis API endpoint
- [x] Update `lib/stores.ts` -- add message fetching from Redis
- [x] Update `components/dashboard/dashboard-provider.tsx` -- poll messages
- [x] Update `components/dashboard/message-log.tsx` -- show fetched messages with type and display name
- [x] Update `components/dashboard/agent-detail.tsx` -- adapt to simplified Redis-based detail
- [x] Update `components/dashboard/agent-list.tsx` -- remove consumers column
- [x] Update `components/dashboard/master-pool.tsx` -- simplify to agentId only
- [x] Update `app/(dashboard)/messages/page.tsx` -- update info banner and table
- [x] Update plan status to complete

## Deviations

None.
