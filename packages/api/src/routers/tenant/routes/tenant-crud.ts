import { tenantAdmins, tenantAuditLogs, tenants } from "@doca/db";
import {
  createTenantSchema,
  tenantIdSchema,
  updateTenantSchema,
} from "@doca/db/schemas-types";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdmin, requireAuth, requireTenantAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

// Create a new tenant
export const createTenantRoute = protectedProcedure
  .input(createTenantSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const now = new Date().toISOString();
    const tenantId = crypto.randomUUID();

    await context.db.insert(tenants).values({
      id: tenantId,
      name: input.name,
      type: input.type,
      address: input.address,
      contactInfo: input.contactInfo ?? null,
      logo: input.logo ?? null,
      services: input.services ? JSON.stringify(input.services) : null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      placeDataRef: input.placeDataRef,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Creator becomes tenant admin
    await context.db.insert(tenantAdmins).values({
      id: crypto.randomUUID(),
      tenantId,
      userId,
      createdAt: now,
    });

    // Audit log
    await context.db.insert(tenantAuditLogs).values({
      id: crypto.randomUUID(),
      tenantId,
      actorId: userId,
      action: "TENANT_CREATED",
      entityType: "tenant",
      entityId: tenantId,
      details: JSON.stringify({ name: input.name }),
      createdAt: now,
    });

    const [tenant] = await context.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    return { tenant };
  });

// Get a single tenant
export const getTenantRoute = protectedProcedure
  .input(tenantIdSchema)
  .handler(async ({ context, input }) => {
    requireAuth(context);

    const [tenant] = await context.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, input.tenantId))
      .limit(1);

    if (!tenant) {
      return { tenant: null };
    }

    const admins = await context.db
      .select()
      .from(tenantAdmins)
      .where(eq(tenantAdmins.tenantId, input.tenantId));

    return {
      tenant: {
        ...tenant,
        services: tenant.services
          ? (JSON.parse(tenant.services) as string[])
          : [],
      },
      admins,
    };
  });

// Update a tenant
export const updateTenantRoute = protectedProcedure
  .input(updateTenantSchema)
  .handler(async ({ context, input }) => {
    const { userId } = await requireTenantAdmin(context, input.id);
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updatedAt: now };
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.address !== undefined) {
      updateData.address = input.address;
    }
    if (input.contactInfo !== undefined) {
      updateData.contactInfo = input.contactInfo;
    }
    if (input.logo !== undefined) {
      updateData.logo = input.logo;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.services !== undefined) {
      updateData.services = input.services
        ? JSON.stringify(input.services)
        : null;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.website !== undefined) {
      updateData.website = input.website;
    }

    await context.db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, input.id));

    await context.db.insert(tenantAuditLogs).values({
      id: crypto.randomUUID(),
      tenantId: input.id,
      actorId: userId,
      action: "TENANT_UPDATED",
      entityType: "tenant",
      entityId: input.id,
      details: JSON.stringify({ changedFields: Object.keys(updateData) }),
      createdAt: now,
    });

    const [tenant] = await context.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, input.id))
      .limit(1);

    return { tenant };
  });

// List all tenants (admin) or tenants where user is admin
export const listTenantsRoute = protectedProcedure
  .input(
    z
      .object({
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().min(1).max(50).default(20),
      })
      .optional()
  )
  .handler(async ({ context }) => {
    const { userId } = requireAuth(context);
    const role = context.auth?.sessionClaims?.metadata?.role;

    if (role === "admin") {
      // Admin sees all tenants
      const allTenants = await context.db
        .select()
        .from(tenants)
        .orderBy(tenants.createdAt);

      return {
        tenants: allTenants.map((t) => ({
          ...t,
          services: t.services ? (JSON.parse(t.services) as string[]) : [],
        })),
      };
    }

    // Non-admin sees only their managed tenants
    const adminRecords = await context.db
      .select()
      .from(tenantAdmins)
      .where(eq(tenantAdmins.userId, userId));

    if (adminRecords.length === 0) {
      return { tenants: [] };
    }

    const tenantIds = adminRecords.map((r) => r.tenantId);
    const allTenants = await context.db.select().from(tenants);
    const managedTenants = allTenants.filter((t) => tenantIds.includes(t.id));

    return {
      tenants: managedTenants.map((t) => ({
        ...t,
        services: t.services ? (JSON.parse(t.services) as string[]) : [],
      })),
    };
  });

// List tenant admins
export const listTenantAdminsRoute = protectedProcedure
  .input(tenantIdSchema)
  .handler(async ({ context, input }) => {
    await requireTenantAdmin(context, input.tenantId);

    const admins = await context.db
      .select()
      .from(tenantAdmins)
      .where(eq(tenantAdmins.tenantId, input.tenantId));

    return { admins };
  });

// Add tenant admin (platform admin only)
export const addTenantAdminRoute = protectedProcedure
  .input(
    z.object({
      tenantId: z.string().min(1),
      userId: z.string().min(1),
    })
  )
  .handler(async ({ context, input }) => {
    requireAdmin(context);
    const now = new Date().toISOString();

    await context.db.insert(tenantAdmins).values({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      userId: input.userId,
      createdAt: now,
    });

    await context.db.insert(tenantAuditLogs).values({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      actorId: context.auth!.userId!,
      action: "ADMIN_ADDED",
      entityType: "tenant_admin",
      entityId: input.userId,
      createdAt: now,
    });

    return { success: true };
  });

// Get tenant audit log
export const getTenantAuditLogRoute = protectedProcedure
  .input(
    z.object({
      tenantId: z.string().min(1),
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(50),
    })
  )
  .handler(async ({ context, input }) => {
    await requireTenantAdmin(context, input.tenantId);

    const logs = await context.db
      .select()
      .from(tenantAuditLogs)
      .where(eq(tenantAuditLogs.tenantId, input.tenantId))
      .orderBy(tenantAuditLogs.createdAt);

    const reversed = logs.reverse();
    const start = (input.page - 1) * input.pageSize;
    const paged = reversed.slice(start, start + input.pageSize);

    return {
      logs: paged,
      total: logs.length,
      page: input.page,
      pageSize: input.pageSize,
    };
  });
