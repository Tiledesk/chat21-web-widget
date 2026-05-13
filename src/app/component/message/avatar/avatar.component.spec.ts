import { Injectable } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ImageRepoService } from '../../../../chat21-core/providers/abstract/image-repo.service';

import { AvatarComponent } from './avatar.component';

@Injectable()
class ImageRepoStub extends ImageRepoService {
  getImagePhotoUrl(uid: string): string {
    return `https://cdn.test/photo/${uid}`;
  }
  checkImageExists(_uid: string, _cb: (exist: boolean) => void): void {}
}

describe('AvatarComponent', () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AvatarComponent],
      providers: [{ provide: ImageRepoService, useClass: ImageRepoStub }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    component.baseLocation = 'https://app.test';
  });

  it('should create', () => {
    component.senderID = 'user_1';
    component.senderFullname = 'Alice';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('ngOnInit should prefer remote photo when checkImageExists returns true', () => {
    const remote = 'https://cdn.test/photo/bot_1';
    spyOn(AvatarComponent.prototype as any, 'checkImageExists').and.callFake((_url: string, cb: (b: boolean) => void) => {
      cb(true);
    });
    component.senderID = 'bot_1';
    component.senderFullname = 'Support Bot';
    component.ngOnInit();
    expect(component.url).toBe(remote);
  });

  it('ngOnInit should keep default bot asset when remote image missing', () => {
    spyOn(AvatarComponent.prototype as any, 'checkImageExists').and.callFake((_url: string, cb: (b: boolean) => void) => {
      cb(false);
    });
    component.senderID = 'bot_1';
    component.senderFullname = 'Bot';
    component.ngOnInit();
    expect(component.url).toBe(component.baseLocation + '/assets/images/tommy_bot_tiledesk.svg');
  });

  it('ngOnInit should use human default when not bot and photo missing', () => {
    spyOn(AvatarComponent.prototype as any, 'checkImageExists').and.callFake((_url: string, cb: (b: boolean) => void) => {
      cb(false);
    });
    component.senderID = 'user_99';
    component.senderFullname = 'Bob';
    component.ngOnInit();
    expect(component.url).toBe(component.baseLocation + '/assets/images/chat_human_avatar.svg');
  });

  it('checkImageExists should invoke callback on image load', (done) => {
    const imgCtor = window.Image;
    (window as any).Image = function MockImage(this: any) {
      setTimeout(() => this.onload && this.onload(), 0);
      return this;
    } as any;
    component.checkImageExists('https://x', (ok) => {
      (window as any).Image = imgCtor;
      expect(ok).toBe(true);
      done();
    });
  });

  it('checkImageExists should invoke callback false on error', (done) => {
    const imgCtor = window.Image;
    (window as any).Image = function MockImage(this: any) {
      setTimeout(() => this.onerror && this.onerror(), 0);
      return this;
    } as any;
    component.checkImageExists('https://bad', (ok) => {
      (window as any).Image = imgCtor;
      expect(ok).toBe(false);
      done();
    });
  });

  it('onBotImgError should swap to local bot svg', () => {
    const target = { src: 'bad' } as any;
    component.baseLocation = 'https://host';
    component.onBotImgError({ target });
    expect(target.src).toContain('tommy_bot_tiledesk.svg');
  });

  it('onHumanImgError should swap to local human svg', () => {
    const target = { src: 'bad' } as any;
    component.baseLocation = 'https://host';
    component.onHumanImgError({ target });
    expect(target.src).toContain('chat_human_avatar.svg');
  });

  it('template should expose accessible name on avatar image (bot)', () => {
    spyOn(AvatarComponent.prototype as any, 'checkImageExists').and.stub();
    component.senderID = 'bot_x';
    component.senderFullname = 'Helper Bot';
    fixture.detectChanges();
    const img = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(img?.getAttribute('alt')).toBeTruthy();
    expect(img?.getAttribute('role')).toBe('img');
  });
});
