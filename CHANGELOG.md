# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.1] - Unreleased
### Added
- Support device groups in device triggers.
- Initial device introspection during device registration.

### Fixed
- Fix bug which caused marking triggers as invalid on parametric endpoints containing an underscore.

## [1.0.0-alpha.1] - 2020-06-18
### Added
- Device registration page.
- Add button for device credentials wipe on device page.
- Error messages when accessing pages with invalid direct URLs.
- Pairing API health check.
- Support to device metadata.
- Add support to custom headers and method for trigger HTTP actions
- Login form JWT token validation.
- Astarte Flow technology preview.
- AMQP trigger actions.
- Device error triggers.

### Changed
- Look & feel.
- Paginate device list page.
- Configuration accepts both base Astarte API URL and specific component URLs.
- Explicit timestamp is enabled by default for all mappings when interface type is changed to
  datastream.

## [0.11.3] - Unreleased
### Added
- Label for property unset in device live events page.

### Fixed
- Fix wrong measurement unit used for mapping expiry.

## [0.11.2] - 2020-08-14
### Fixed
- Match API labels with their corresponding status.

## [0.11.1] - 2020-05-18
### Added
- Byte multiples in device stats stable.

### Fixed
- Allow placeholders in data trigger paths
- Fix label positioning in device stats pie chart.

## [0.11.0] - 2020-04-13

## [0.11.0-rc.1] - 2020-02-26

## [0.11.0-rc.0] - 2020-01-26
### Added
- Support for data triggers matching "any interfaces".
- Group creation page.
- Device groups editing.
- API health check.
- Mapping database retention policy and TTL.
- API status and installed interfaces/triggers in Home page.
- Add button for device credential inhibit/enable.

### Changed
- New datastream mappings have explicit\_timestamp by default
- Data triggers will match path /* by default
- Expect API configuration URLs not ending with /v1
- Build Docker image with the latest nginx 1.x version
- Enable server owned, object aggregated, datastream interfaces.

### Fixed
- Handle property interfaces in Device data page.

## [0.11.0-beta.2] - 2020-01-24
### Added
- Implement group viewer in ReactJS (start switching to ReactJS).

## [0.11.0-beta.1] - 2019-01-09
### Added
- Editor only mode, a mode with an Interface editor but no Astarte connection.
- Device list page
- Warn users about deprecated object aggregated / datastream path. New object aggregated
  interfaces should use /collectioname instead.
- Auto refresh for interface, trigger and device Lists
- Group list page
- Device last sent data page

### Changed
- Migrated to Elm 0.19

## [0.10.2] - 2019-12-09
### Fixed
- Change endpoint regular expression validation to match the one used by Astarte.

## [0.10.1] - 2019-10-02

## [0.10.0] - 2019-04-16

## [0.10.0-rc.0] - 2019-04-03
### Added
- Detailed changeset errors.

### Fixed
- Minor UI fixes.

## [0.10.0-beta.3] - 2018-12-19
### Fixed
- Change recommended interface name regexp.
- Enter key press behavior: close confirm message instead of reloading page.
- Accept `/*` as a valid Data Trigger path.
- Do not show inconsistent data while showing an existing trigger.

## [0.10.0-beta.2] - 2018-10-19
### Added
- Advice user about interface names.
- Update mapping endpoint validation.
- Encode data trigger known value according to matching interface path.
- Add dockerignore file to prevent build output from being copied in the docker volume.
- Home page.

### Fixed
- Disallow interface minor to be 0 when major is also 0
- Device triggers showing as Data triggers in the trigger builder.

## [0.10.0-beta.1] - 2018-08-27
### Added
- First Astarte release.
