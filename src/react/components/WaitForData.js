/*
   This file is part of Astarte.

   Copyright 2020 Ispirata Srl

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const WaitForData = ({data, status, showRefreshing = false, fallback, children}) => {
  switch (status) {
    case "ok":
      return children(data);

    case "loading":
      if (!showRefreshing && data)
        return children(data);
      else
        return fallback || null;

    case "err":
      return fallback || null;

    default:
      return null;
  }
};

export default WaitForData;