<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { DataTableService } from "@/lib/services/data-table-service";
import { IDataTable } from "@/lib/types";
import { RouterLink } from "vue-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Table } from "lucide-vue-next";
import { toast } from "vue-sonner";
import CardAction from "@/components/ui/card/CardAction.vue";
import CardContent from "@/components/ui/card/CardContent.vue";

const { t } = useI18n();

const tables = ref<IDataTable[]>([]);
const isCreateDialogOpen = ref(false);
const newTableName = ref("");
const isDeleteDialogOpen = ref(false);
const tableToDeleteId = ref<string | null>(null);

const loadTables = async () => {
  tables.value = await DataTableService.listTables();
};

onMounted(async () => {
  await loadTables();
});

const createTable = async () => {
  if (!newTableName.value) return;
  try {
    await DataTableService.createTable(newTableName.value);
    await loadTables();
    isCreateDialogOpen.value = false;
    newTableName.value = "";
    toast.success(t("datatables.tableCreated"));
  } catch (error) {
    toast.error(t("datatables.createTableError"));
  }
};

const openDeleteDialog = (e: Event, id: string) => {
  e.preventDefault();
  tableToDeleteId.value = id;
  isDeleteDialogOpen.value = true;
};

const confirmDelete = async () => {
  if (!tableToDeleteId.value) return;
  try {
    await DataTableService.deleteTable(tableToDeleteId.value);
    await loadTables();
    toast.success(t("datatables.tableDeleted"));
  } catch (error) {
    toast.error(t("datatables.deleteTableError"));
  } finally {
    isDeleteDialogOpen.value = false;
    tableToDeleteId.value = null;
  }
};
</script>

<template>
  <div class="p-8 w-full mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-2">
          {{ t("datatables.title") }}
        </h1>
        <p class="text-muted-foreground">{{ t("datatables.description") }}</p>
      </div>
      <Button @click="isCreateDialogOpen = true">
        <Plus class="mr-2 h-4 w-4" />
        {{ t("datatables.newTable") }}
      </Button>
    </div>

    <div
      class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
    >
      <Card
        v-for="table in tables"
        :key="table.id"
        class="h-full py-4 pt-0 gap-2 hover:shadow-lg hover:border-primary/20 transition-all duration-200 overflow-hidden flex flex-col"
      >
        <RouterLink
          :to="`/datatables/${table.id}`"
          class="flex flex-col py-4 gap-2 h-full"
        >
          <div
            class="aspect-video bg-muted/30 relative overflow-hidden border-b flex items-center justify-center"
          >
            <Table class="h-12 w-12 opacity-20" />
          </div>
          <CardHeader class="group relative">
            <CardTitle
              class="text-lg line-clamp-1 group-hover:text-primary transition-colors"
              >{{ table.name }}</CardTitle
            >
            <CardAction
              class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md cursor-pointer z-10"
              :title="t('common.delete')"
              @click.stop.prevent="openDeleteDialog($event, table.id)"
            >
              <Trash2 class="h-4 w-4" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <CardDescription>{{
              t(
                "datatables.columnsCount",
                { count: table.columns.length },
                table.columns.length,
              )
            }}</CardDescription>
          </CardContent>
        </RouterLink>
      </Card>
    </div>

    <Dialog v-model:open="isCreateDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t("datatables.createTableTitle") }}</DialogTitle>
          <DialogDescription>
            {{ t("datatables.createTableDesc") }}
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Input
            v-model="newTableName"
            :placeholder="t('datatables.tableNamePlaceholder')"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isCreateDialogOpen = false">{{
            t("common.cancel")
          }}</Button>
          <Button @click="createTable">{{ t("datatables.newTable") }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isDeleteDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t("common.confirm") }}</DialogTitle>
          <DialogDescription>
            {{ t("datatables.deleteConfirm") }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteDialogOpen = false">{{
            t("common.cancel")
          }}</Button>
          <Button variant="destructive" @click="confirmDelete">{{
            t("common.delete")
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
