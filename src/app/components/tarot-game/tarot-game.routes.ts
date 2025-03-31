import { Routes } from "@angular/router";
import { TarotHomeComponent } from "./tarot-home/tarot-home.component";
import { TarotGameMainComponent } from "./tarot-game-main/tarot-game-main.component";

export const TarotRoutes: Routes = [
    {
        path: '',
        component: TarotGameMainComponent,
        children: [
            {
                path: '',
                component: TarotHomeComponent
            }
        ]
    }
];