import type { ICellRendererComp, ICellRendererParams } from "ag-grid-community";
import z from "zod";
import { Scouting } from "$lib/model/scouting";

export class MissingPitscoutComp implements ICellRendererComp {
    eGui!: HTMLElement;
    params!: ICellRendererParams;

    init(params: ICellRendererParams): void {
        this.params = params;

        this.eGui = document.createElement('div');
        // create your gui here
        const questions: Scouting.PIT.QuestionArr = params.data.question;

        // Task:
        // Create links for each of the questions, they will go to the correct link
    }
    
    getGui(): HTMLElement {
        return this.eGui;
    }

    refresh(params: ICellRendererParams): boolean {
        this.params = params;
        this.updateState();
        return true;
    }

    updateState() {

    }

    destroy(): void {
        
    }
}