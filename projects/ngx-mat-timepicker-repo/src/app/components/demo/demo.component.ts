import {Component, OnInit, ViewChild} from "@angular/core";
//
import {NgxMatTimepickerComponent, NgxMatTimepickerLocaleService} from "ngx-mat-timepicker";
//
import {NgxMatTimepickerLocaleKey} from "../../shared/ngx-mat-timepicker-locale-key.enum";
//
import {catchError, map, of, switchMap, timer} from "rxjs";
import {ajax, AjaxResponse} from "rxjs/ajax";
import {DateTime} from "ts-luxon";
import TypeWriter from "typewriter-effect/dist/core.js";
import pkg from "../../../../../../package.json";

interface NgxMatTimepickerTheme {
    description: string;
    value: string;
}

const pkgName = "ngx-mat-timepicker";

@Component({
    // tslint:disable-next-line:component-selector
    selector: "app-demo",
    templateUrl: "demo.component.html",
    styleUrls: ["demo.component.scss"]
})
export class NgxMatTimepickerDemoComponent implements OnInit {

    get currentLocale(): NgxMatTimepickerLocaleKey {
        return this._localeOverrideSrv.locale as NgxMatTimepickerLocaleKey;
    }

    get currentLocaleKey(): string {
        return this.myLocalesReversed[this.currentLocale];
    }

    get buildRef(): string {
        return `${pkg.version}-build-${pkg.build}`;
    }

    githubLink: string = `https://github.com/tonysamperi/${pkgName}`;
    latestVersion: string = "";
    maxTime: DateTime = DateTime.local().startOf("day").set({
        hour: 16,
        minute: 0
    });
    messages: string[] = [];
    minTime: DateTime = this.maxTime.set({hour: 14});
    myLocaleKeys: NgxMatTimepickerLocaleKey[];
    myLocales: Record<keyof typeof NgxMatTimepickerLocaleKey, string> = {
        en: "en-GB",
        it: "it-IT",
        es: "es-ES",
        fr: "fr-FR"
    };
    myLocalesReversed: Record<string, NgxMatTimepickerLocaleKey> = Object.fromEntries(Object.entries(this.myLocales).map(a => a.reverse()));
    npmLink: string = `https://www.npmjs.com/package/${pkgName}`;
    @ViewChild("pickerH") pickerFreeInput: NgxMatTimepickerComponent;
    selectedTheme: NgxMatTimepickerTheme;
    selectedTime: string;
    selectedTimeFreeInput: string;
    selectedTimeWithRange: string;
    showInput: boolean = !0;
    themes: NgxMatTimepickerTheme[] = [
        {value: "", description: "Light"},
        {value: "dark-theme", description: "Dark"}
    ];
    timeRegex: RegExp = /([0-9]|1\d):[0-5]\d (AM|PM)/;
    year: number = new Date().getFullYear();

    private _nextLocale: number = 0;

    constructor(private _localeOverrideSrv: NgxMatTimepickerLocaleService) {
    }

    ngOnInit(): void {
        this.myLocaleKeys = Object.keys(this.myLocales) as NgxMatTimepickerLocaleKey[];
        this.selectedTheme = this.themes[0];
        ajax.get(`https://unpkg.com/${pkgName}@latest/package.json`)
            .pipe(map((raw: AjaxResponse<any>) => {
                return raw.response?.version;
            }))
            .subscribe({
                next: (version: string) => {
                    this.latestVersion = version;
                }
            });

        if (document.querySelector("[mtp-messages]")) {
            ajax.get(`./assets/messages.json`)
                .pipe(
                    switchMap((resp: AjaxResponse<any>) => {
                        this.messages = resp.response.messages;

                        return timer(150);
                    }),
                    catchError(() => of([]))
                )
                .subscribe({
                    next: () => {
                        this.messages.forEach((m: string, i: number) => {
                            new TypeWriter(`[mtp-messages] li:nth-child(${i + 1})`, {
                                strings: [m],
                                autoStart: true,
                                loop: true
                            });
                        });
                    }
                });
        }
    }

    onTimeSet($event: string): void {
        console.info("TIME UPDATED", $event);
    }

    selectedTimeFreeInputChanged($event: string): void {
        console.info("TIME CHANGED");
        this.pickerFreeInput.updateTime($event);
    }

    updateLocale(localeKey?: NgxMatTimepickerLocaleKey): void {
        if (localeKey) {
            this._nextLocale = this.myLocaleKeys.indexOf(localeKey) - 1;
        }
        this._localeOverrideSrv.updateLocale(
            this.myLocales[this.myLocaleKeys[++this._nextLocale]]
        );
        (this._nextLocale >= this.myLocaleKeys.length - 1) && (this._nextLocale = -1);
    }

    updateTheme(theme: NgxMatTimepickerTheme): void {
        this.selectedTheme = theme;
        document.body.classList.toggle("dark-theme", !!theme.value);
    }

    updateTime($event: string, targetProp: string): void {
        console.info("TIME SET", $event);
        (this as any)[targetProp] = $event;
    }

}
