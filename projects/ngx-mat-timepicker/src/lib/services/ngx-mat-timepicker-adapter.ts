import {NgxMatTimepickerFormat} from "../models/ngx-mat-timepicker-format.enum";
import {NgxMatTimepickerFormatType} from "../models/ngx-mat-timepicker-format.type";
import {NgxMatTimepickerPeriods} from "../models/ngx-mat-timepicker-periods.enum";
import {NgxMatTimepickerOptions} from "../models/ngx-mat-timepicker-options.interface";
//
import {DateTime, LocaleOptions, NumberingSystem} from "ts-luxon";

// @dynamic
export class NgxMatTimepickerAdapter {
  static defaultFormat: NgxMatTimepickerFormatType = 12;
  static defaultLocale: string = "en-US";
  static defaultNumberingSystem: NumberingSystem = "latn";

  /***
   *  Format hour according to time format (12 or 24)
   */
  static formatHour(
    currentHour: number,
    format: NgxMatTimepickerFormatType,
    period: NgxMatTimepickerPeriods
  ): number {
    if (this.isTwentyFour(format)) {
      return currentHour;
    }
    const hour =
      period === NgxMatTimepickerPeriods.AM ? currentHour : currentHour + 12;

    if (period === NgxMatTimepickerPeriods.AM && hour === 12) {
      return 0;
    } else if (period === NgxMatTimepickerPeriods.PM && hour === 24) {
      return 12;
    }

    return hour;
  }

  static formatTime(time: string, opts: NgxMatTimepickerOptions): string {
    if (!time?.length || time.length < 4) {
      return "Invalid Time";
    }
    return this.getIsoTimeStr(time);
  }

  static fromDateTimeToString(
    time: DateTime,
    format: NgxMatTimepickerFormatType
  ): string {
    return time
      .reconfigure({
        numberingSystem: this.defaultNumberingSystem,
        locale: this.defaultLocale,
      })
      .toFormat(
        this.isTwentyFour(format)
          ? NgxMatTimepickerFormat.TWENTY_FOUR
          : NgxMatTimepickerFormat.TWELVE
      );
  }

  static isBetween(
    time: DateTime,
    before: DateTime,
    after: DateTime,
    unit: "hours" | "minutes" = "minutes"
  ): boolean {
    const innerUnit = unit === "hours" ? unit : void 0;

    return (
      this.isSameOrBefore(time, after, innerUnit) &&
      this.isSameOrAfter(time, before, innerUnit)
    );
  }

  static isSameOrAfter(
    time: DateTime,
    compareWith: DateTime,
    unit: "hours" | "minutes" = "minutes"
  ): boolean {
    if (unit === "hours") {
      return time.hour >= compareWith.hour;
    }

    return (
      time.hasSame(compareWith, unit) || time.valueOf() > compareWith.valueOf()
    );
  }

  static isSameOrBefore(
    time: DateTime,
    compareWith: DateTime,
    unit: "hours" | "minutes" = "minutes"
  ): boolean {
    if (unit === "hours") {
      return time.hour <= compareWith.hour;
    }

    return (
      time.hasSame(compareWith, unit) || time.valueOf() <= compareWith.valueOf()
    );
  }

  static isTimeAvailable(
    time: string,
    min?: DateTime,
    max?: DateTime,
    granularity?: "hours" | "minutes",
    minutesGap?: number | null,
    format?: number
  ): boolean {
    if (!time) {
      return void 0;
    }

    const convertedTime = this.parseTime(time, { format });
    const minutes = convertedTime.minute;

    if (minutesGap && minutes === minutes && minutes % minutesGap !== 0) {
      throw new Error(
        `Your minutes - ${minutes} doesn\'t match your minutesGap - ${minutesGap}`
      );
    }
    const isAfter =
      min && !max && this.isSameOrAfter(convertedTime, min, granularity);
    const isBefore =
      max && !min && this.isSameOrBefore(convertedTime, max, granularity);
    const between =
      min && max && this.isBetween(convertedTime, min, max, granularity);
    const isAvailable = !min && !max;

    return isAfter || isBefore || between || isAvailable;
  }

  static isTwentyFour(format: NgxMatTimepickerFormatType): boolean {
    return format === 24;
  }

  /**
   *
   * Converts a time string to ISO format. Expects time string like '00:00', '12:18', '1:23', '06:30 am', '24:00', '0815', '2218'.
   *
   * @example
   * console.log(getTime('06:30 pm'))
   * '18:30'
   *
   * console.log(getTime('12:00 am'))
   * '00:00'
   *
   * console.log(getTime('1815'))
   * '18:15'
   *
   * @param {string} time time string to convert from
   * @returns {string} time string in ISO format
   */
  static getIsoTimeStr(time: string | Date): string {
    if (!time || time === undefined) {
      return null;
    }

    let timeStr: string;
    if (Object.prototype.toString.call(time) === "[object String]") {
      timeStr = time?.toString();
    } else if (DateTime.fromJSDate(time as Date)?.isValid) {
      timeStr = DateTime.fromJSDate(time as Date).toFormat("HH:mm");
    } else {
      timeStr = "00:00";
    }

    const match = timeStr.match(
      /^(((\d{1,2}):(\d{1,2}))|(\d{4}))($| (am)| (pm)| (AM)| (PM))$/
    );

    if (!match) {
      return null;
    }

    let hours = 0;
    let minutes = 0;

    if (match[5]) {
      // time is in hhmm format
      hours = parseInt(match[5].substring(0, 2), 10);
      minutes = parseInt(match[5].substring(2), 10);
    } else {
      // time is in h:m format
      hours = parseInt(match[3], 10);
      minutes = parseInt(match[4], 10);
    }

    if (match[7] && match[7].toLowerCase() === "am" && hours === 12) {
      hours = 0;
    } else if (match[7] && match[7].toLowerCase() === "pm") {
      hours += 12;
    }

    return ("00" + hours).slice(-2) + ":" + ("00" + minutes).slice(-2);
  }

  static parseTime(time: string, opts: NgxMatTimepickerOptions): DateTime {
    if (!time?.length || time.length < 4) return null;
    const localeOpts = this._getLocaleOptionsByTime(time, opts);
    let timeMask = NgxMatTimepickerFormat.TWENTY_FOUR_SHORT;
    time = this.getIsoTimeStr(time);

    return DateTime.fromFormat(time, timeMask, {
      numberingSystem: localeOpts.numberingSystem,
      locale: localeOpts.locale,
    });
  }

  /**
   *
   * @param time
   * @param opts
   * @private
   */
  private static _getLocaleOptionsByTime(
    time: string,
    opts: NgxMatTimepickerOptions
  ): LocaleOptions {
    const { numberingSystem, locale } = DateTime.now()
      .reconfigure({
        locale: opts.locale,
        numberingSystem: opts.numberingSystem,
        outputCalendar: opts.outputCalendar,
        defaultToEN: opts.defaultToEN,
      })
      .resolvedLocaleOptions();

    return isNaN(parseInt(time, 10))
      ? {
          numberingSystem: numberingSystem as NumberingSystem,
          locale,
        }
      : {
          numberingSystem: this.defaultNumberingSystem,
          locale: this.defaultLocale,
        };
  }
}
