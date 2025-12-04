
import { useState } from "react";
import type { ReactNode } from "react";

import DivisionTable from "../../components/DivisionTable";
import AddDivisionModal from "../../components/AddDivisionModal";
import MemberTable from "../../components/MemberTable";
import AddMemberModal from "../../components/AddMemberModal";
import EditMemberModal from "../../components/EditMemberModal";

import type {
  Division,
  DivisionStatus,
  CreateDivisionInput,
} from "../../types/division";
import type { IRegisterResponse } from "../../types/auth";
import type {
  Member,
  CreateMemberInput as CreateMemberPayload,
} from "../../types/member";
import type { Project } from "../../types/project";

interface DivisionMemberPageProps {
  
  project: Project;

  divisions: Division[];
  users: IRegisterResponse[];

  divisionCount: number;
  memberCount: number;

  canEdit?: boolean;
  currentUserId?: string;

  onChangeStatus?: (id: number, status: DivisionStatus) => void;
  onEdit?: (division: Division) => void;
  onDelete?: (id: number) => void;
  onAddDivision?: (input: CreateDivisionInput) => void;

  members: Member[];
  canManageMembers?: boolean;
  onAddMember?: (input: CreateMemberPayload) => void;
  onDeleteMember?: (id: number) => void;
  onUpdateMember?: (id: number, input: CreateMemberPayload) => void;

  memberContent?: ReactNode;
}

export default function DivisionMemberPage({
  project,
  divisions,
  users,
  divisionCount,
  memberCount,

  canEdit = false,
  currentUserId,
  onChangeStatus,
  onEdit,
  onDelete,
  onAddDivision,

  members,
  canManageMembers = false,
  onAddMember,
  onDeleteMember,
  onUpdateMember,

  memberContent,
}: DivisionMemberPageProps) {
  const [addDivisionOpen, setAddDivisionOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleSubmitNewDivision = (input: CreateDivisionInput) => {
    if (onAddDivision) onAddDivision(input);
    setAddDivisionOpen(false);
  };

  const handleSubmitNewMember = (input: CreateMemberPayload) => {
    if (onAddMember) onAddMember(input);
    setAddMemberOpen(false);
  };

  const handleRowClickMember = (member: Member) => {
    if (!canManageMembers) return;
    setSelectedMember(member);
    setEditMemberOpen(true);
  };


  const handleDeleteDivisionCascade = (divisionId: number) => {

    if (onDelete) {
      onDelete(divisionId);
    }


    if (onDeleteMember) {
      const membersInDivision = members.filter(
        (m) => m.divisionId === divisionId
      );

      membersInDivision.forEach((m) => {
        onDeleteMember(m.id);
      });
    }
  };

  return (
    <div className="mt-6 space-y-10">
      
      <div className="flex gap-6 justify-center items-center">
        <div className="w-44 flex flex-col items-center justify-center py-3 rounded-xl shadow-sm bg-white border border-slate-200 text-black font-poppins transition hover:shadow-md">
          <span className="font-semibold text-base mb-1 text-quinary">
            Divisi
          </span>
          <span className="font-bold text-2xl text-slate-900">
            {divisionCount}
          </span>
        </div>

        <div className="w-44 flex flex-col items-center justify-center py-3 rounded-xl shadow-sm bg-white border border-slate-200 text-black font-poppins transition hover:shadow-md">
          <span className="font-semibold text-base mb-1 text-quinary">
            Member
          </span>
          <span className="font-bold text-2xl text-slate-900">
            {memberCount}
          </span>
        </div>
      </div>

      
      <div className="space-y-12">
        
        <section className="space-y-4">
          <AddDivisionModal
            open={addDivisionOpen}
            onClose={() => setAddDivisionOpen(false)}
            onSubmit={handleSubmitNewDivision}
            existingDivisions={divisions}
            existingMembers={members}
            project={project} // ✅ penting: kirim project ke modal
          />

          <DivisionTable
            divisions={divisions}
            users={users}
            canEdit={canEdit}
            currentUserId={currentUserId}
            onChangeStatus={onChangeStatus}
            onEdit={onEdit}
            onDelete={handleDeleteDivisionCascade} // 👈 pakai cascade
            onAddDivision={() => setAddDivisionOpen(true)}
          />
        </section>

        
        <section className="space-y-4">
          <AddMemberModal
            open={addMemberOpen}
            onClose={() => setAddMemberOpen(false)}
            onSubmit={handleSubmitNewMember}
            users={users}
            divisions={divisions}
            existingMembers={members}
          />

          <MemberTable
            members={members}
            users={users}
            divisions={divisions}
            canManageMembers={canManageMembers}
            onRowClick={handleRowClickMember}
            onAddMember={() => setAddMemberOpen(true)}
          />

          {memberContent && <div className="pt-1">{memberContent}</div>}

          <EditMemberModal
            open={editMemberOpen}
            member={selectedMember}
            users={users}
            divisions={divisions}
            onClose={() => setEditMemberOpen(false)}
            onSubmit={(data) => {
              if (!selectedMember || !onUpdateMember) return;
              onUpdateMember(selectedMember.id, data);
              setEditMemberOpen(false);
            }}
            onDelete={(id) => {
              if (!onDeleteMember) return;
              onDeleteMember(id);
              setEditMemberOpen(false);
            }}
          />
        </section>
      </div>
    </div>
  );
}
