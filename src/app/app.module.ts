import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { TipoSelezioneComponent } from './pages/tipo-selezione/tipo-selezione.component';
import { ArchivedComponent } from './pages/archived/archived.component';

@NgModule({
  declarations: [
    AppComponent,
    ArchivedComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule,         
    AppRoutingModule,
    TipoSelezioneComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
