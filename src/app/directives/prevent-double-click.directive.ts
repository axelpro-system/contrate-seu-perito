import { Directive, HostListener, Input, ElementRef, Renderer2, OnInit, OnDestroy } from '@angular/core';

@Directive({
    selector: '[appPreventDoubleClick]',
    standalone: true,
})
export class PreventDoubleClickDirective implements OnInit, OnDestroy {
    @Input() appPreventDoubleClick = true;
    private isSubmitting = false;
    private originalText = '';
    private observer: MutationObserver | null = null;

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    ngOnInit() {
        this.originalText = this.el.nativeElement.textContent || '';
        this.observer = new MutationObserver(() => {
            if (!this.isSubmitting) {
                this.originalText = this.el.nativeElement.textContent || '';
            }
        });
        this.observer.observe(this.el.nativeElement, { childList: true, subtree: true, characterData: true });
    }

    @HostListener('click', ['$event'])
    onClick(event: Event): void {
        if (!this.appPreventDoubleClick) return;
        if (this.isSubmitting) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        this.isSubmitting = true;
        this.renderer.setProperty(this.el.nativeElement, 'disabled', true);
        const loadingText = this.el.nativeElement.getAttribute('data-loading-text') || 'Enviando...';
        this.renderer.setProperty(this.el.nativeElement, 'textContent', loadingText);

        setTimeout(() => {
            this.isSubmitting = false;
            this.renderer.setProperty(this.el.nativeElement, 'disabled', false);
            this.renderer.setProperty(this.el.nativeElement, 'textContent', this.originalText);
        }, 3000);
    }

    ngOnDestroy() {
        this.observer?.disconnect();
    }
}
