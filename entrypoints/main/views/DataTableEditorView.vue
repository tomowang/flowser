<script setup lang="ts">
import { ref, onMounted, computed, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { DataTableService } from "@/lib/services/data-table-service";
import { IDataTable, IDataTableRow, IDataTableColumn } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, ArrowLeft, Settings, Database, GripVertical } from "lucide-vue-next";
import { toast } from "vue-sonner";
import draggable from "vuedraggable";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const tableId = route.params.id as string;

const table = ref<IDataTable | undefined>();
const rows = ref<IDataTableRow[]>([]);
const columns = computed(() => table.value?.columns || []);

// State for Manage Columns
const isColumnsDialogOpen = ref(false);
const localColumns = ref<IDataTableColumn[]>([]);
const newColumnName = ref("");
const newColumnType = ref<"string" | "number" | "boolean" | "json">("string");

// State for Add/Edit Row
const isRowDialogOpen = ref(false);
const editingRowId = ref<number | null>(null);
const localRowData = ref<Record<string, any>>({});

const loadData = async () => {
  table.value = await DataTableService.getTable(tableId);
  if (!table.value) {
    toast.error("Table not found");
    router.push("/datatables");
    return;
  }
  rows.value = await DataTableService.getRows(tableId);
};

onMounted(async () => {
  await loadData();
});

// Column Management
const openColumnsDialog = () => {
  if (!table.value) return;
  localColumns.value = JSON.parse(JSON.stringify(table.value.columns));
  isColumnsDialogOpen.value = true;
};

const addColumn = () => {
  if (!newColumnName.value) return;
  if (localColumns.value.some((c) => c.name === newColumnName.value)) {
    toast.error(t("datatables.columnExists"));
    return;
  }
  localColumns.value.push({
    name: newColumnName.value,
    type: newColumnType.value,
  });
  newColumnName.value = "";
  newColumnType.value = "string";
};

const removeColumn = (index: number) => {
  localColumns.value.splice(index, 1);
};

const saveColumns = async () => {
  if (!table.value) return;
  try {
    await DataTableService.updateTable(table.value.id, {
      columns: JSON.parse(JSON.stringify(localColumns.value)),
    });
    await loadData();
    isColumnsDialogOpen.value = false;
    toast.success(t("datatables.columnsUpdated"));
  } catch (error) {
    console.error(error);
    toast.error(t("datatables.updateColumnsError"));
  }
};

// Row Management
const openAddRowDialog = () => {
  editingRowId.value = null;
  // Initialize with empty values or defaults
  localRowData.value = {};
  columns.value.forEach((col) => {
    localRowData.value[col.name] = "";
  });
  isRowDialogOpen.value = true;
};

const openEditRowDialog = (row: IDataTableRow) => {
  editingRowId.value = row.rowId;
  localRowData.value = JSON.parse(JSON.stringify(row.data));
  isRowDialogOpen.value = true;
};

const saveRow = async () => {
  try {
    // Process types
    const dataToSave = { ...localRowData.value };
    columns.value.forEach((col) => {
      let val = dataToSave[col.name];
      if (col.type === "number") {
        dataToSave[col.name] = Number(val);
      } else if (col.type === "boolean") {
        dataToSave[col.name] = val === "true" || val === true;
      } else if (col.type === "json") {
        try {
          if (typeof val === "string") {
            dataToSave[col.name] = JSON.parse(val);
          }
        } catch (e) {
          // Keep as string if invalid JSON? Or error?
          // For now let's assume valid JSON or simple handling
        }
      }
    });

    if (editingRowId.value) {
      await DataTableService.updateRow(tableId, editingRowId.value, dataToSave);
      toast.success(t("datatables.rowUpdated"));
    } else {
      await DataTableService.addRow(tableId, dataToSave);
      toast.success(t("datatables.rowAdded"));
    }
    await loadData();
    isRowDialogOpen.value = false;
  } catch (error) {
    toast.error(t("datatables.saveRowError"));
  }
};

const deleteRow = async (rowId: number) => {
  try {
    await DataTableService.deleteRow(tableId, rowId);
    await loadData();
    toast.success(t("datatables.rowDeleted"));
  } catch (error) {
    toast.error(t("datatables.deleteRowError"));
  }
};
</script>

<template>
  <div class="p-8 w-full mx-auto max-w-[1920px]">
    <div class="flex items-center gap-4 mb-8">
      <Button variant="ghost" size="icon" @click="router.push('/datatables')">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <div v-if="table">
        <h1 class="text-3xl font-bold tracking-tight mb-1">{{ table.name }}</h1>
        <div class="flex items-center gap-2 text-muted-foreground text-sm">
          <Database class="h-3.5 w-3.5" />
          <span>{{
            t("datatables.rowsCount", { count: rows.length }, rows.length)
          }}</span>
        </div>
      </div>
      <div class="ml-auto flex gap-2">
        <Button variant="outline" @click="openColumnsDialog">
          <Settings class="mr-2 h-4 w-4" />
          {{ t("datatables.columns") }}
        </Button>
        <Button @click="openAddRowDialog">
          <Plus class="mr-2 h-4 w-4" />
          {{ t("datatables.addRow") }}
        </Button>
      </div>
    </div>

    <div
      v-if="columns.length === 0"
      class="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground"
    >
      <p class="mb-4">{{ t("datatables.noColumns") }}</p>
      <Button variant="outline" @click="openColumnsDialog">{{
        t("datatables.defineColumns")
      }}</Button>
    </div>

    <div v-else class="rounded-md border bg-white overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-muted/50 text-muted-foreground font-medium border-b">
            <tr>
              <th class="h-10 px-4 align-middle whitespace-nowrap w-[50px]">
                ID
              </th>
              <th
                v-for="col in columns"
                :key="col.name"
                class="h-10 px-4 align-middle whitespace-nowrap"
              >
                {{ col.name }}
                <span class="text-xs opacity-50 ml-1">({{ col.type }})</span>
              </th>
              <th class="h-10 px-4 align-middle w-[100px] text-right">
                {{ t("common.actions") }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="row in rows"
              :key="row.rowId"
              class="hover:bg-muted/5 transition-colors"
            >
              <td class="p-4 align-middle whitespace-nowrap text-muted-foreground">
                {{ row.rowId }}
              </td>
              <td
                v-for="col in columns"
                :key="col.name"
                class="p-4 align-middle whitespace-nowrap"
              >
                <div v-if="col.type === 'boolean'">
                  {{
                    row.data[col.name]
                      ? t("datatables.true")
                      : t("datatables.false")
                  }}
                </div>
                <div
                  v-else-if="col.type === 'json'"
                  class="font-mono text-xs max-w-[200px] truncate"
                >
                  {{ JSON.stringify(row.data[col.name]) }}
                </div>
                <div v-else>{{ row.data[col.name] }}</div>
              </td>
              <td class="p-4 align-middle text-right">
                <div class="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="openEditRowDialog(row)"
                  >
                    <Settings class="h-4 w-4" />
                    <!-- Using settings icon as edit for now, or maybe pencil if available -->
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive hover:text-destructive"
                    @click="deleteRow(row.rowId)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
            <tr v-if="rows.length === 0">
              <td
                :colspan="columns.length + 2"
                class="p-8 text-center text-muted-foreground"
              >
                {{ t("datatables.noData") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Manage Columns Dialog -->
    <Dialog v-model:open="isColumnsDialogOpen">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ t("datatables.manageColumns") }}</DialogTitle>
          <DialogDescription>{{
            t("datatables.manageColumnsDesc")
          }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="flex gap-2 items-end">
            <div class="grid gap-1.5 flex-1">
              <label class="text-sm font-medium">{{ t("common.name") }}</label>
              <Input v-model="newColumnName" placeholder="e.g. email" />
            </div>
            <div class="grid gap-1.5 w-[140px]">
              <label class="text-sm font-medium">{{ t("common.type") }}</label>
              <Select v-model="newColumnType">
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="t('credentials.selectType')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">{{
                    t("datatables.types.string")
                  }}</SelectItem>
                  <SelectItem value="number">{{
                    t("datatables.types.number")
                  }}</SelectItem>
                  <SelectItem value="boolean">{{
                    t("datatables.types.boolean")
                  }}</SelectItem>
                  <SelectItem value="json">{{
                    t("datatables.types.json")
                  }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button @click="addColumn"><Plus class="h-4 w-4" /></Button>
          </div>

          <div class="border rounded-md divide-y">
            <draggable
              v-model="localColumns"
              item-key="name"
              handle=".handle"
              ghost-class="bg-muted"
            >
              <template #item="{ element: col, index: idx }">
                <div class="flex items-center justify-between p-3">
                  <div class="flex items-center gap-3">
                    <GripVertical
                      class="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing handle"
                    />
                    <span class="font-medium">{{ col.name }}</span>
                    <span class="text-xs bg-muted px-2 py-1 rounded">{{
                      col.type
                    }}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive"
                    @click="removeColumn(idx)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </template>
            </draggable>
            <div
              v-if="localColumns.length === 0"
              class="p-4 text-center text-sm text-muted-foreground"
            >
              {{ t("datatables.noColumnsDefined") }}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isColumnsDialogOpen = false">{{
            t("common.cancel")
          }}</Button>
          <Button @click="saveColumns">{{ t("common.saveChanges") }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Row Dialog -->
    <Dialog v-model:open="isRowDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{
            editingRowId ? t("datatables.editRow") : t("datatables.addRow")
          }}</DialogTitle>
        </DialogHeader>
        <div class="py-4 space-y-4">
          <div v-for="col in columns" :key="col.name" class="grid gap-1.5">
            <label class="text-sm font-medium"
              >{{ col.name }}
              <span class="text-xs text-muted-foreground"
                >({{ col.type }})</span
              ></label
            >

            <Input
              v-if="col.type === 'string'"
              v-model="localRowData[col.name]"
            />
            <Input
              v-else-if="col.type === 'number'"
              type="number"
              v-model="localRowData[col.name]"
            />
            <select
              v-else-if="col.type === 'boolean'"
              v-model="localRowData[col.name]"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option :value="true">{{ t("datatables.true") }}</option>
              <option :value="false">{{ t("datatables.false") }}</option>
            </select>
            <textarea
              v-else-if="col.type === 'json'"
              v-model="localRowData[col.name]"
              class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
            ></textarea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isRowDialogOpen = false">{{
            t("common.cancel")
          }}</Button>
          <Button @click="saveRow">{{ t("common.save") }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
