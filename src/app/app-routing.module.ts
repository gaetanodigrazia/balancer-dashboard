import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TipoSelezioneComponent } from './pages/tipo-selezione/tipo-selezione.component';
import { ArchivedComponent } from './pages/archived/archived.component';

const routes: Routes = [
  { path: '', component: TipoSelezioneComponent },
  { path: 'archived', component: ArchivedComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
